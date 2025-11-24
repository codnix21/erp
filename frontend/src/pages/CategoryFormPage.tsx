import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const categorySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      parentId: null,
    },
  });

  const { data: category, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryService.getOne(id!),
    enabled: isEdit,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  useEffect(() => {
    if (category?.data) {
      setValue('name', category.data.name);
      setValue('description', category.data.description || '');
      setValue('parentId', category.data.parentId || null);
    }
  }, [category, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      const submitData = {
        ...data,
        parentId: data.parentId || undefined,
      };
      return isEdit ? categoryService.update(id!, submitData) : categoryService.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success(isEdit ? 'Категория обновлена' : 'Категория создана');
      navigate('/categories');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Ошибка при сохранении категории';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const categories = categoriesData?.data || [];
  const availableCategories = isEdit
    ? categories.filter((c) => c.id !== id)
    : categories;

  return (
    <div>
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к категориям
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать категорию' : 'Создать категорию'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="Название категории"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Описание категории"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Родительская категория
            </label>
            <select
              {...register('parentId', {
                setValueAs: (v) => (v === '' ? null : v),
              })}
              className="input"
            >
              <option value="">Нет (корневая категория)</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.parentId && (
              <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              disabled={mutation.isPending}
            >
              <Save className="w-5 h-5" />
              {mutation.isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
            <Link
              to="/categories"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

