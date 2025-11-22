import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../services/api';

const companySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  inn: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  defaultCurrency: z.string().min(1, 'Валюта обязательна'),
  taxRate: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      defaultCurrency: 'RUB',
      taxRate: '20',
      isActive: true,
    },
  });

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await api.get(`/companies/${id}`);
      return response.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (companyData?.data) {
      const company = companyData.data;
      setValue('name', company.name);
      setValue('inn', company.inn || '');
      setValue('address', company.address || '');
      setValue('phone', company.phone || '');
      setValue('email', company.email || '');
      setValue('defaultCurrency', company.defaultCurrency);
      setValue('taxRate', company.taxRate?.toString() || '20');
      setValue('isActive', company.isActive);
    }
  }, [companyData, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CompanyFormData) => {
      const submitData = {
        ...data,
        inn: data.inn || undefined,
        email: data.email || undefined,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : undefined,
      };
      return isEdit
        ? api.put(`/companies/${id}`, submitData)
        : api.post('/companies', submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      alert(isEdit ? 'Компания обновлена' : 'Компания создана');
      navigate('/companies');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при сохранении');
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к компаниям
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать компанию' : 'Создать компанию'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название компании *
            </label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
              <input {...register('inn')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валюта по умолчанию *
              </label>
              <select {...register('defaultCurrency')} className="input">
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input {...register('phone')} className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <textarea {...register('address')} className="input" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              НДС (%)
            </label>
            <input {...register('taxRate')} type="number" step="0.01" className="input" />
          </div>

          {isEdit && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Активна</span>
              </label>
            </div>
          )}

          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Ошибка: {(mutation.error as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link to="/companies" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

