import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

interface Company {
  id: string;
  name: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
  defaultCurrency: string;
  taxRate?: any;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
    customers: number;
    suppliers: number;
    orders: number;
    invoices: number;
  };
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await api.get(`/companies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/companies');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при удалении компании');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки компании или компания не найдена
      </div>
    );
  }

  const company: Company = data.data;

  const handleDelete = () => {
    if (confirm(`Вы уверены, что хотите удалить компанию "${company.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div>
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к компаниям
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.inn && <p className="text-gray-600 mt-1">ИНН: {company.inn}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission('users:update') && (
            <Link to={`/companies/${id}/edit`} className="btn btn-primary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          )}
          {hasPermission('users:delete') && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Название</label>
              <p className="font-medium mt-1">{company.name}</p>
            </div>
            {company.inn && (
              <div>
                <label className="text-sm text-gray-500">ИНН</label>
                <p className="font-medium mt-1">{company.inn}</p>
              </div>
            )}
            {company.email && (
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{company.email}</span>
                </div>
              </div>
            )}
            {company.phone && (
              <div>
                <label className="text-sm text-gray-500">Телефон</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{company.phone}</span>
                </div>
              </div>
            )}
            {company.address && (
              <div>
                <label className="text-sm text-gray-500">Адрес</label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="font-medium">{company.address}</span>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Валюта по умолчанию</label>
              <p className="font-medium mt-1">{company.defaultCurrency}</p>
            </div>
            {company.taxRate && (
              <div>
                <label className="text-sm text-gray-500">НДС (%)</label>
                <p className="font-medium mt-1">
                  {typeof company.taxRate === 'object' && company.taxRate.toString
                    ? company.taxRate.toString()
                    : company.taxRate}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Статус</label>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    company.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {company.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Дата создания</label>
              <p className="font-medium mt-1">
                {new Date(company.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {company._count && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Статистика</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Товары</span>
                <span className="font-semibold text-lg">{company._count.products || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Клиенты</span>
                <span className="font-semibold text-lg">{company._count.customers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Поставщики</span>
                <span className="font-semibold text-lg">{company._count.suppliers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Заказы</span>
                <span className="font-semibold text-lg">{company._count.orders || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Счета</span>
                <span className="font-semibold text-lg">{company._count.invoices || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

