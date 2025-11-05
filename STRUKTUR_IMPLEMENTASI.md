# Struktur Implementasi Aplikasi Inventory Full-Stack

## Teknologi yang Digunakan

### Frontend
- **Next.js 13** (App Router)
- **React 18** dengan TypeScript
- **Tailwind CSS** untuk styling
- **shadcn/ui** untuk komponen UI
- **Lucide React** untuk icons

### Backend
- **Next.js API Routes** untuk server-side logic
- **PostgreSQL** (via Supabase) sebagai database
- **bcryptjs** untuk password hashing

### Authentication
- Custom authentication dengan HTTP-only cookies
- Session management menggunakan cookies
- Protected routes dengan Next.js middleware

## Struktur Database

### Tabel: `users`
```sql
- id (uuid, PRIMARY KEY) - Auto-generated user ID
- username (text, UNIQUE) - Username untuk login
- password (text) - Hashed password dengan bcrypt
- created_at (timestamptz) - Waktu pembuatan akun
- updated_at (timestamptz) - Waktu terakhir update
```

### Tabel: `items`
```sql
- id (serial, PRIMARY KEY) - Auto-incrementing item ID
- name (varchar 255) - Nama barang
- sku (varchar 50, UNIQUE) - Stock Keeping Unit (kode unik)
- quantity (integer, CHECK >= 0) - Jumlah stok
- price (numeric 10,2, CHECK >= 0) - Harga satuan
- description (text, nullable) - Deskripsi barang
- category (varchar 100, nullable) - Kategori barang
- user_id (uuid, FOREIGN KEY) - Referensi ke tabel users
- created_at (timestamptz) - Waktu pembuatan item
- updated_at (timestamptz) - Waktu terakhir update
```

### Row Level Security (RLS)
- Semua tabel dilindungi dengan RLS
- Users hanya bisa melihat dan mengelola data mereka sendiri
- Policies terpisah untuk SELECT, INSERT, UPDATE, DELETE

## Struktur File Utama

```
project/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          # Endpoint login
│   │   │   ├── register/route.ts       # Endpoint register
│   │   │   └── logout/route.ts         # Endpoint logout
│   │   └── items/
│   │       ├── route.ts                # GET (list) & POST (create)
│   │       └── [id]/route.ts           # GET, PUT, DELETE by ID
│   ├── dashboard/
│   │   └── page.tsx                    # Halaman dashboard utama
│   ├── login/
│   │   └── page.tsx                    # Halaman login
│   ├── register/
│   │   └── page.tsx                    # Halaman register
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Homepage (redirect)
│   └── globals.css                     # Global styles
├── components/
│   ├── item-form.tsx                   # Form input/edit item
│   ├── items-table.tsx                 # Tabel daftar items
│   └── ui/                             # shadcn/ui components
├── lib/
│   ├── supabase.ts                     # Supabase client & types
│   ├── auth.ts                         # Auth helper functions
│   └── utils.ts                        # Utility functions
├── middleware.ts                       # Protected routes middleware
├── next.config.js                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind configuration
└── tsconfig.json                       # TypeScript configuration
```

## API Routes

### Authentication Endpoints

#### POST `/api/auth/register`
Mendaftarkan user baru.

**Request Body:**
```json
{
  "username": "string",
  "password": "string" (min 6 karakter)
}
```

**Response (201):**
```json
{
  "message": "Registrasi berhasil",
  "userId": "uuid"
}
```

**Errors:**
- 400: Field tidak lengkap atau password terlalu pendek
- 409: Username sudah terdaftar

#### POST `/api/auth/login`
Login user dan membuat session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil",
  "userId": "uuid"
}
```
*Sets HTTP-only cookie: `auth_user_id`*

**Errors:**
- 400: Field tidak lengkap
- 401: Username atau password salah

#### POST `/api/auth/logout`
Logout user dan menghapus session.

**Response (200):**
```json
{
  "message": "Logout berhasil"
}
```

### Items Endpoints

#### GET `/api/items`
Mengambil daftar items milik user yang login.

**Query Parameters:**
- `page` (optional, default: 1) - Nomor halaman
- `limit` (optional, default: 10) - Jumlah item per halaman
- `search` (optional) - Pencarian berdasarkan name atau sku
- `category` (optional) - Filter berdasarkan kategori

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Laptop Dell XPS",
      "sku": "DELL-XPS-001",
      "quantity": 5,
      "price": 15000000,
      "description": "Laptop gaming high-end",
      "category": "Elektronik",
      "user_id": "uuid",
      "created_at": "2025-11-04T...",
      "updated_at": "2025-11-04T..."
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

**Errors:**
- 401: Unauthorized (belum login)

#### POST `/api/items`
Menambahkan item baru.

**Request Body:**
```json
{
  "name": "string",           // Required
  "sku": "string",            // Required, harus unique
  "quantity": number,         // Required, >= 0
  "price": number,            // Required, >= 0
  "description": "string",    // Optional
  "category": "string"        // Optional
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Laptop Dell XPS",
  ...
}
```

**Errors:**
- 400: Field wajib tidak lengkap atau nilai invalid
- 401: Unauthorized
- 409: SKU sudah ada

#### GET `/api/items/[id]`
Mengambil detail item berdasarkan ID.

**Response (200):**
```json
{
  "id": 1,
  "name": "Laptop Dell XPS",
  ...
}
```

**Errors:**
- 401: Unauthorized
- 404: Item tidak ditemukan

#### PUT `/api/items/[id]`
Memperbarui item berdasarkan ID.

**Request Body:** (sama seperti POST)

**Response (200):**
```json
{
  "id": 1,
  "name": "Laptop Dell XPS Updated",
  ...
}
```

**Errors:**
- 400: Field wajib tidak lengkap atau nilai invalid
- 401: Unauthorized
- 404: Item tidak ditemukan
- 409: SKU sudah ada

#### DELETE `/api/items/[id]`
Menghapus item berdasarkan ID.

**Response (200):**
```json
{
  "message": "Item berhasil dihapus"
}
```

**Errors:**
- 401: Unauthorized
- 500: Gagal menghapus

## Komponen React Utama

### ItemForm Component (`components/item-form.tsx`)
Form untuk menambah atau mengedit item.

**Props:**
- `item?: Item` - Item yang akan diedit (optional)
- `onSuccess: () => void` - Callback saat berhasil
- `onCancel?: () => void` - Callback untuk membatalkan edit

**Features:**
- Validasi input di client-side
- Loading state saat submit
- Error handling
- Support create dan update mode

### ItemsTable Component (`components/items-table.tsx`)
Tabel untuk menampilkan daftar items.

**Props:**
- `items: Item[]` - Array of items
- `onEdit: (item: Item) => void` - Callback untuk edit
- `onDelete: (id: number) => void` - Callback untuk delete

**Features:**
- Responsive table layout
- Color-coded quantity badges
- Formatted price (IDR)
- Formatted dates
- Delete confirmation dialog
- Empty state

### Dashboard Page (`app/dashboard/page.tsx`)
Halaman utama untuk mengelola inventory.

**Features:**
- Statistics cards (total items, total value, low stock)
- Tabs untuk beralih antara list dan form
- Search functionality
- Real-time filtering
- Refresh button
- Logout functionality

## Authentication Flow

### Register Flow
1. User mengisi form register (username, password)
2. Password divalidasi (min 6 karakter)
3. Request POST ke `/api/auth/register`
4. Server hash password dengan bcrypt (10 rounds)
5. Insert user ke database
6. Redirect ke login page

### Login Flow
1. User mengisi form login (username, password)
2. Request POST ke `/api/auth/login`
3. Server verify password dengan bcrypt
4. Set HTTP-only cookie `auth_user_id`
5. Redirect ke dashboard

### Protected Routes
1. Middleware check cookie `auth_user_id`
2. Jika ada dan mengakses /login atau /register → redirect ke /dashboard
3. Jika tidak ada dan mengakses /dashboard → redirect ke /login
4. API routes check cookie dan return 401 jika tidak ada

## CRUD Operations Flow

### CREATE
1. User isi form di dashboard (tab "Tambah Item")
2. Submit form → POST `/api/items`
3. Server validasi input
4. Insert ke database dengan user_id dari cookie
5. Return created item
6. Refresh list dan clear form

### READ
1. Dashboard mount → fetch `/api/items`
2. Server query database dengan filter user_id
3. Support pagination dan search
4. Return list items dengan metadata
5. Display di tabel

### UPDATE
1. User click tombol Edit di tabel
2. Switch ke tab "Edit Item" dengan form pre-filled
3. User ubah data dan submit
4. PUT `/api/items/[id]`
5. Server validasi dan update database
6. Return updated item
7. Refresh list dan switch ke tab list

### DELETE
1. User click tombol Hapus di tabel
2. Tampilkan confirmation dialog
3. User confirm → DELETE `/api/items/[id]`
4. Server delete dari database
5. Refresh list

## Security Features

### Password Security
- Password di-hash dengan bcrypt (10 salt rounds)
- Tidak pernah disimpan dalam plain text
- Tidak dikembalikan dalam response API

### Session Security
- HTTP-only cookies (tidak dapat diakses JavaScript)
- SameSite: Strict
- Secure flag di production
- Max age: 24 jam (86400 detik)

### Database Security
- Row Level Security (RLS) enabled
- Users hanya bisa akses data mereka sendiri
- Prepared statements via Supabase client
- Input validation di server-side

### Input Validation
- Required fields validation
- Type checking (number, string)
- Range validation (quantity >= 0, price >= 0)
- Unique constraint (SKU, username)
- Length validation (password min 6)

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Cara Menjalankan

### Development
```bash
npm install
npm run dev
```
Aplikasi berjalan di http://localhost:3000

### Production
```bash
npm run build
npm run start
```

## Cara Menggunakan Aplikasi

1. **Register**: Buat akun baru di `/register`
2. **Login**: Login dengan akun yang sudah dibuat
3. **Dashboard**: Otomatis redirect ke dashboard setelah login
4. **Tambah Item**: Klik tab "Tambah Item" dan isi form
5. **Lihat Items**: Semua items ditampilkan di tab "Daftar Items"
6. **Search**: Gunakan search box untuk mencari berdasarkan nama, SKU, atau kategori
7. **Edit**: Klik tombol Edit (icon pensil) untuk mengedit item
8. **Delete**: Klik tombol Hapus (icon sampah) untuk menghapus item
9. **Logout**: Klik tombol Logout di header

## Fitur Tambahan

### Statistics Dashboard
- Total items count
- Total inventory value (sum of price * quantity)
- Low stock alert (items dengan quantity < 10)

### Search & Filter
- Real-time search di client-side
- Search by name, SKU, atau category
- Case-insensitive search

### Responsive Design
- Mobile-first approach
- Breakpoints untuk tablet dan desktop
- Responsive table dengan horizontal scroll

### User Experience
- Loading states pada semua actions
- Error messages yang jelas
- Success feedback
- Empty states
- Confirmation dialogs untuk destructive actions
- Color-coded badges untuk status
- Formatted currency (IDR)
- Formatted dates (Indonesian locale)

## Potential Improvements

1. **Multi-user features**: Admin roles, team management
2. **Advanced filtering**: Multiple filters, date range
3. **Export/Import**: CSV, Excel export/import
4. **Stock movements**: Track in/out transactions
5. **Notifications**: Low stock alerts, email notifications
6. **Analytics**: Charts, reports, trends
7. **Barcode**: Barcode scanning for SKU
8. **Images**: Product images upload
9. **Categories management**: Separate table for categories
10. **Suppliers**: Supplier information and management
