# 🔄 Reusable Loading Components System

A comprehensive, professional loading system for React + TypeScript applications with Tailwind CSS.

## 📦 Components Overview

### 1. **Spinner** - Base Loader
Small, inline circular spinner for buttons and inline loading states.

```tsx
import { Spinner } from './components/loading';

<Spinner size="md" color="blue" />
```

**Props:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `color`: `'blue' | 'white' | 'gray' | 'green' | 'red' | 'yellow'` (default: `'blue'`)
- `className`: Optional custom classes

---

### 2. **ButtonLoader** - Action Button with Loading State
Professional loading button with built-in spinner and disabled state.

```tsx
import { ButtonLoader } from './components/loading';

const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.submitForm(data);
  } finally {
    setLoading(false);
  }
};

<ButtonLoader
  loading={loading}
  onClick={handleSubmit}
  label="Submit"
  loadingText="Submitting..."
  variant="primary"
  size="md"
/>
```

**Props:**
- `loading`: boolean (required)
- `onClick`: Click handler
- `label`: Button text (required)
- `loadingText`: Text shown during loading (default: "Loading...")
- `type`: `'button' | 'submit' | 'reset'` (default: `'button'`)
- `variant`: `'primary' | 'secondary' | 'danger' | 'success' | 'outline'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `fullWidth`: boolean (default: `false`)
- `disabled`: boolean (default: `false`)
- `icon`: React node for icon
- `className`: Optional custom classes

---

### 3. **PageSkeleton** - Page Loading Placeholder
Skeleton UI for entire pages, lists, tables, and cards.

```tsx
import { PageSkeleton } from './components/loading';

{isLoading ? (
  <PageSkeleton count={5} layout="table" />
) : (
  <DataTable data={data} />
)}
```

**Props:**
- `count`: Number of skeleton items (default: `5`)
- `layout`: `'list' | 'table' | 'card' | 'form'` (default: `'list'`)
- `className`: Optional custom classes

**Layouts:**
- **list**: Stacked content blocks
- **table**: Table with header and rows
- **card**: Grid of card layouts
- **form**: Form fields with labels

---

### 4. **GlobalLoader** - Full-Screen Overlay
Full-screen loading overlay for heavy operations or page transitions.

```tsx
import { GlobalLoader } from './components/loading';

<GlobalLoader 
  visible={isProcessing} 
  message="Processing your request..." 
  backdrop="dark"
/>
```

**Props:**
- `visible`: boolean (required)
- `message`: Optional message text (default: "Loading...")
- `backdrop`: `'light' | 'dark' | 'blur'` (default: `'dark'`)

---

### 5. **useGlobalLoader** - Global Loading Hook
Context-based hook for managing global loading state across your app.

```tsx
import { useGlobalLoader } from './components/loading';

function MyComponent() {
  const { showLoader, hideLoader } = useGlobalLoader();

  const handleLongProcess = async () => {
    showLoader('Fetching data...');
    try {
      await heavyApiCall();
    } finally {
      hideLoader();
    }
  };

  return <button onClick={handleLongProcess}>Start</button>;
}
```

**API:**
- `showLoader(message?: string)`: Show global loader
- `hideLoader()`: Hide global loader
- `setMessage(message: string)`: Update message while visible
- `isVisible`: boolean - Current visibility state
- `message`: string - Current message

---

## 🚀 Quick Start

### Setup (Already Done!)
The `GlobalLoaderProvider` is already wrapped around your app in `root.tsx`.

### Basic Usage Examples

#### 1. Button with Loading
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSave = async () => {
  setIsSubmitting(true);
  try {
    await axios.post('/api/save', data);
    toast.success('Saved successfully!');
  } catch (error) {
    toast.error('Failed to save');
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <ButtonLoader
    loading={isSubmitting}
    onClick={handleSave}
    label="Save Changes"
    loadingText="Saving..."
    variant="primary"
  />
);
```

#### 2. Page with Skeleton Loading
```tsx
const [loading, setLoading] = useState(true);
const [mentors, setMentors] = useState([]);

useEffect(() => {
  const fetchMentors = async () => {
    try {
      const response = await axios.get('/api/mentors');
      setMentors(response.data);
    } finally {
      setLoading(false);
    }
  };
  fetchMentors();
}, []);

return (
  <div>
    {loading ? (
      <PageSkeleton count={8} layout="table" />
    ) : (
      <MentorTable data={mentors} />
    )}
  </div>
);
```

#### 3. Global Loader for Navigation
```tsx
import { useGlobalLoader } from './components/loading';
import { useNavigate } from 'react-router';

function Dashboard() {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useGlobalLoader();

  const handleNavigate = async (path: string) => {
    showLoader('Loading page...');
    // Simulate data prefetch
    await prefetchPageData(path);
    navigate(path);
    hideLoader();
  };

  return <button onClick={() => handleNavigate('/teams')}>Go to Teams</button>;
}
```

#### 4. Multiple Buttons with Different States
```tsx
const [assigningMentor, setAssigningMentor] = useState(false);
const [deletingTeam, setDeletingTeam] = useState(false);

return (
  <>
    <ButtonLoader
      loading={assigningMentor}
      onClick={handleAssignMentor}
      label="Assign Mentor"
      loadingText="Assigning..."
      variant="primary"
      icon={<UserPlusIcon />}
    />
    
    <ButtonLoader
      loading={deletingTeam}
      onClick={handleDeleteTeam}
      label="Delete Team"
      loadingText="Deleting..."
      variant="danger"
    />
  </>
);
```

---

## 🎨 Customization

### Custom Spinner Colors
```tsx
<Spinner size="lg" color="green" className="my-4" />
```

### Custom Button Styles
```tsx
<ButtonLoader
  loading={loading}
  label="Custom"
  className="shadow-xl hover:shadow-2xl"
  variant="outline"
/>
```

### Custom Backdrop
```tsx
<GlobalLoader visible={loading} backdrop="blur" />
```

---

## 🔧 Integration with Axios

### Create an Axios Interceptor (Optional)
```tsx
// utils/api.ts
import axios from 'axios';
import { useGlobalLoader } from './components/loading';

let activeRequests = 0;

export const setupAxiosInterceptors = (
  showLoader: () => void,
  hideLoader: () => void
) => {
  axios.interceptors.request.use((config) => {
    if (activeRequests === 0) {
      showLoader();
    }
    activeRequests++;
    return config;
  });

  axios.interceptors.response.use(
    (response) => {
      activeRequests--;
      if (activeRequests === 0) {
        hideLoader();
      }
      return response;
    },
    (error) => {
      activeRequests--;
      if (activeRequests === 0) {
        hideLoader();
      }
      return Promise.reject(error);
    }
  );
};
```

---

## ✅ Best Practices

1. **Use ButtonLoader for all form actions** - Provides consistent UX
2. **Use PageSkeleton for initial page loads** - Better than blank screens
3. **Use GlobalLoader sparingly** - Only for truly global operations
4. **Match skeleton layout to actual content** - Use `layout="table"` for tables
5. **Provide descriptive loading messages** - "Assigning mentor..." vs "Loading..."
6. **Clean up loading states** - Always use `finally` blocks
7. **Don't nest loaders** - Choose one loading pattern per operation

---

## 📱 Responsive Design

All components are fully responsive and work seamlessly on mobile, tablet, and desktop.

---

## 🎯 TypeScript Support

All components are fully typed with comprehensive interfaces. IntelliSense will guide you!

---

## 🐛 Troubleshooting

**Issue:** Global loader not working
- **Solution:** Ensure `GlobalLoaderProvider` is in `root.tsx`

**Issue:** Button stays disabled
- **Solution:** Make sure to set `loading={false}` in error/finally blocks

**Issue:** Skeleton doesn't match content
- **Solution:** Use the correct `layout` prop that matches your UI

---

## 🎉 You're All Set!

Start replacing old loading states with these components for a professional, consistent UX!
