import { useState, useEffect, useContext } from 'react'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import toast from 'react-hot-toast'
import { ConfirmContext } from './AdminLayout'
import ImageUpload from './ImageUpload'
import { Plus, SquarePen, Trash2, X, Save } from 'lucide-react'
import { useAdminLang } from './adminI18n'

const EMPTY = {
  title: '',
  title_en: '',
  content: '',
  content_en: '',
  category: 'أخبار',
  category_en: 'News',
  image_url: '',
  published: true,
  created_at: '',
}

export default function ManageNews() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isPublished = (value) => value === 1 || value === true

  const load = () => {
    setLoading(true)
    api
      .get('/news/all')
      .then((d) => setItems(d || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    let filtered = items

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.title_en?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.category_en?.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) =>
        statusFilter === 'published'
          ? isPublished(item.published)
          : !isPublished(item.published)
      )
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, statusFilter])

  const openAdd = () => {
    setForm({ ...EMPTY, created_at: new Date().toISOString().split('T')[0] })
    setEditId(null)
    setModal('form')
  }

  const openEdit = (item) => {
    setForm({
      title: item.title || '',
      title_en: item.title_en || '',
      content: item.content || '',
      content_en: item.content_en || '',
      category: item.category || 'أخبار',
      category_en: item.category_en || 'News',
      image_url: item.image_url || '',
      published: isPublished(item.published),
      created_at: item.created_at ? item.created_at.split('T')[0] : '',
    })
    setEditId(item.id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(isRtl ? 'الحقل مطلوب' : 'Field required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        published: !!form.published,
      }

        if (payload.created_at === '') {
          payload.created_at = null
        }

      if (editId) {
        await api.put(`/news/${editId}`, payload)
        toast.success(isRtl ? '✅ تم الحفظ بنجاح' : '✅ Saved successfully')
      } else {
        await api.post('/news', payload)
        toast.success(isRtl ? '✅ تمت الإضافة بنجاح' : '✅ Added successfully')
      }

      load()
      setModal(null)
    } catch (e) {
      toast.error(`❌ ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف الخبر' : 'Delete news item?',
      message: isRtl
        ? 'هل أنت متأكد من حذف هذا الخبر؟ لا يمكن التراجع عن هذا الإجراء.'
        : 'Are you sure you want to delete this news item? This action cannot be undone.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/news/${id}`)
      toast.success(isRtl ? '✅ تم الحذف بنجاح' : '✅ Deleted successfully')
      load()
    } catch (e) {
      toast.error(`❌ ${e.message}`)
    }
  }

  const publishedCount = items.filter((i) => isPublished(i.published)).length
  const draftCount = items.filter((i) => !isPublished(i.published)).length

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl font-bold text-dark">{t.manageNews}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.totalNews}: {items.length}
          </p>
        </div>

        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          {t.addNews}
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t.searchNews}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input-field h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 ${
                isRtl ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.all} ({items.length})
            </button>

            <button
              onClick={() => setStatusFilter('published')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'published'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.published} ({publishedCount})
            </button>

            <button
              onClick={() => setStatusFilter('draft')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.draft} ({draftCount})
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.image}
              </th>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.title}
              </th>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.category}
              </th>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.status}
              </th>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.date}
              </th>
              <th className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-medium text-gray-600`}>
                {t.actions}
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  {t.loading}
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  {t.noResults}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="table-row border-b border-gray-50">
                  <td className="p-3">
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100" />
                    )}
                  </td>

                  <td className="max-w-xs p-4 font-medium text-dark">
                    <div className="line-clamp-1">{item.title}</div>
                    {item.title_en && (
                      <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                        {item.title_en}
                      </div>
                    )}
                  </td>

                  <td className="p-4 text-gray-500">
                    {isRtl ? item.category : item.category_en || item.category}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        isPublished(item.published)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isPublished(item.published) ? t.published : t.draft}
                    </span>
                  </td>

                  <td className="p-4 text-xs text-gray-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-YE' : 'en-US')
                      : '-'}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                        title={t.edit}
                      >
                        <SquarePen size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                        title={t.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal-box">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-xl font-bold text-dark">
                {editId ? t.editNews : t.addNewNews}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <ImageUpload
                value={form.image_url}
                onChange={(v) => setForm({ ...form, image_url: v })}
                folder="news"
                label={t.newsImage}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.titleAr} *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.titleEn}
                  </label>
                  <input
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.date}
                </label>
                <input
                  type="date"
                  value={form.created_at}
                  onChange={(e) => setForm({ ...form, created_at: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.categoryAr}
                  </label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t.categoryEn}
                  </label>
                  <input
                    value={form.category_en}
                    onChange={(e) => setForm({ ...form, category_en: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.contentAr}
                </label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t.contentEn}
                </label>
                <textarea
                  rows={4}
                  value={form.content_en}
                  onChange={(e) => setForm({ ...form, content_en: e.target.value })}
                  className="input-field resize-none"
                  dir="ltr"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-gray-700">{t.publishedPublic}</span>
              </label>
            </div>

            <div className="flex gap-3 border-t p-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>

              <button onClick={() => setModal(null)} className="btn-outline">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
