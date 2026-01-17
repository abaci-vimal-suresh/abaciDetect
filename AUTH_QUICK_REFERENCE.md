# Auth API Quick Reference

## 🚀 Quick Start

### 1. Configure Authentication

Create `.env.local` file:
```env
# For HTTP-Only Cookies (Recommended)
VITE_AUTH_STRATEGY=httponly
VITE_USE_MOCK_AUTH=false

# For Mock Development
VITE_USE_MOCK_AUTH=true
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test Login
- **Mock:** `admin@gmail.com` / `password123`
- **Real API:** Use your backend credentials

---

## 📚 Available Hooks

### `useLogin()`
```typescript
const loginMutation = useLogin();

loginMutation.mutate({ email, password }, {
  onSuccess: (response) => { /* handle success */ },
  onError: (error) => { /* handle error */ }
});
```

### `useLogout()`
```typescript
const logoutMutation = useLogout();
logoutMutation.mutate();
```

### `useProfile()`
```typescript
const { data: profile, isLoading } = useProfile();
```

### `useCheckOrganization()`
```typescript
const { data: orgData } = useCheckOrganization();
```

---

## 🔧 Configuration Options

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_AUTH_STRATEGY` | `httponly` \| `js-cookie` | Cookie strategy |
| `VITE_USE_MOCK_AUTH` | `true` \| `false` | Use mock service |

---

## 🔐 Authentication Strategies

### HTTP-Only Cookies (Default)
✅ Most secure (XSS protection)  
✅ Automatic cookie handling  
✅ Recommended for production  

**Backend Requirements:**
- Sets `HttpOnly` cookie on login
- Validates cookie on protected endpoints

### JS Cookies
✅ Token accessible in JavaScript  
✅ Flexible for cross-domain scenarios  

**Backend Requirements:**
- Returns token in response body
- Validates `Authorization: Bearer <token>`

---

## 🧪 Testing

### With Mock Data
```bash
echo "VITE_USE_MOCK_AUTH=true" > .env.local
npm run dev
```

### With Real API
```bash
echo "VITE_USE_MOCK_AUTH=false" > .env.local
npm run dev
```

---

## 📝 Files Changed

- ✅ `src/api/auth.api.ts` - New auth API service
- ✅ `src/pages/Auth/Login.tsx` - Updated to use hooks
- ✅ `src/contexts/authContext.tsx` - Updated to use hooks
- ✅ `.env.example` - Configuration template

---

## 🐛 Troubleshooting

**Cookies not being sent?**
- Check `withCredentials: true` in axios config
- Verify backend CORS allows credentials

**"Authentication credentials were not provided"?**
- Verify auth strategy matches backend
- Check token/cookie is being set correctly

**Infinite redirect loop?**
- Check `isAuthenticated()` logic
- Verify profile endpoint returns correct data

---

## 📖 Full Documentation

See [walkthrough.md](file:///C:/Users/vimal/.gemini/antigravity/brain/0f31b64b-e39c-4330-872c-5e173a054dd6/walkthrough.md) for complete documentation.
