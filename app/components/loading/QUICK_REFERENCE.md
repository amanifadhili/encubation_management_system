# 🚀 Loading Components - Quick Reference

## Import Statement
```typescript
import { 
  Spinner, 
  ButtonLoader, 
  PageSkeleton, 
  GlobalLoader,
  useGlobalLoader 
} from './components/loading';
```

---

## 1️⃣ Spinner

### Basic Usage
```tsx
<Spinner />
```

### With Options
```tsx
<Spinner size="lg" color="blue" />
```

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| size | string | 'md' | xs, sm, md, lg, xl |
| color | string | 'blue' | blue, white, gray, green, red, yellow |
| className | string | '' | Any Tailwind classes |

---

## 2️⃣ ButtonLoader

### Basic Usage
```tsx
<ButtonLoader
  loading={isLoading}
  onClick={handleClick}
  label="Click Me"
/>
```

### Full Example
```tsx
<ButtonLoader
  loading={isSubmitting}
  onClick={handleSubmit}
  label="Save Changes"
  loadingText="Saving..."
  variant="primary"
  size="md"
  fullWidth={false}
  disabled={false}
  form="my-form-id"
/>
```

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| loading | boolean | required | - |
| onClick | function | - | Click handler |
| label | string | required | Button text |
| loadingText | string | 'Loading...' | Text during loading |
| variant | string | 'primary' | primary, secondary, danger, success, outline |
| size | string | 'md' | sm, md, lg |
| type | string | 'button' | button, submit, reset |
| fullWidth | boolean | false | - |
| disabled | boolean | false | - |
| form | string | - | Form ID for external submission |
| icon | ReactNode | - | Icon element |
| className | string | '' | Custom classes |

---

## 3️⃣ PageSkeleton

### Basic Usage
```tsx
{loading ? <PageSkeleton /> : <Content />}
```

### With Layout
```tsx
<PageSkeleton count={8} layout="table" />
```

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| count | number | 5 | Number of skeleton items |
| layout | string | 'list' | list, table, card, form |
| className | string | '' | Custom classes |

### Layout Examples
```tsx
{/* List Layout - Stacked content */}
<PageSkeleton count={5} layout="list" />

{/* Table Layout - Header + rows */}
<PageSkeleton count={8} layout="table" />

{/* Card Layout - Grid of cards */}
<PageSkeleton count={6} layout="card" />

{/* Form Layout - Form fields with labels */}
<PageSkeleton count={4} layout="form" />
```

---

## 4️⃣ GlobalLoader

### Direct Usage (Rare)
```tsx
<GlobalLoader visible={isLoading} message="Loading..." />
```

### Props
| Prop | Type | Default | Options |
|------|------|---------|---------|
| visible | boolean | required | Show/hide loader |
| message | string | 'Loading...' | Message to display |
| backdrop | string | 'dark' | light, dark, blur |

**Note**: Usually controlled via `useGlobalLoader` hook instead

---

## 5️⃣ useGlobalLoader Hook

### Basic Usage
```tsx
const { showLoader, hideLoader } = useGlobalLoader();

const handleAction = async () => {
  showLoader();
  try {
    await doSomething();
  } finally {
    hideLoader();
  }
};
```

### With Custom Message
```tsx
const { showLoader, hideLoader, setMessage } = useGlobalLoader();

showLoader('Syncing data...');
// Later
setMessage('Almost done...');
// Finally
hideLoader();
```

### API
| Method | Parameters | Description |
|--------|-----------|-------------|
| showLoader | (message?: string) | Show global loader with optional message |
| hideLoader | () | Hide global loader |
| setMessage | (message: string) | Update message while visible |
| isVisible | boolean | Current visibility state |
| message | string | Current message |

---

## 📋 Common Patterns

### Pattern 1: Page with Data Loading
```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.getData();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

return (
  <>
    {loading ? (
      <PageSkeleton count={5} layout="table" />
    ) : (
      <DataTable data={data} />
    )}
  </>
);
```

### Pattern 2: Form Submit Button
```tsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  try {
    await api.submitForm(data);
    toast.success('Saved!');
  } catch (error) {
    toast.error('Failed to save');
  } finally {
    setSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    {/* form fields */}
    <ButtonLoader
      type="submit"
      loading={submitting}
      label="Save"
      loadingText="Saving..."
    />
  </form>
);
```

### Pattern 3: Multiple Action Buttons
```tsx
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);

return (
  <div className="flex gap-2">
    <ButtonLoader
      loading={saving}
      onClick={handleSave}
      label="Save"
      loadingText="Saving..."
      variant="primary"
    />
    <ButtonLoader
      loading={deleting}
      onClick={handleDelete}
      label="Delete"
      loadingText="Deleting..."
      variant="danger"
    />
  </div>
);
```

### Pattern 4: Global Operation
```tsx
const { showLoader, hideLoader } = useGlobalLoader();

const handleSync = async () => {
  showLoader('Syncing with server...');
  try {
    await api.syncAll();
    toast.success('Sync complete!');
  } catch (error) {
    toast.error('Sync failed');
  } finally {
    hideLoader();
  }
};
```

### Pattern 5: External Form Button
```tsx
<form id="user-form" onSubmit={handleSubmit}>
  {/* form fields */}
</form>

<Modal>
  <ButtonLoader
    type="submit"
    form="user-form"
    loading={submitting}
    label="Submit"
  />
</Modal>
```

---

## 🎨 Styling Cheat Sheet

### Button Variants
```tsx
variant="primary"   // Blue background
variant="secondary" // Gray background
variant="danger"    // Red background
variant="success"   // Green background
variant="outline"   // Transparent with border
```

### Button Sizes
```tsx
size="sm"  // Small
size="md"  // Medium (default)
size="lg"  // Large
```

### Skeleton Layouts
```tsx
layout="list"   // Vertical stacked items
layout="table"  // Table with header
layout="card"   // Grid of cards
layout="form"   // Form fields
```

### Spinner Sizes
```tsx
size="xs"  // Extra small (12px)
size="sm"  // Small (16px)
size="md"  // Medium (32px)
size="lg"  // Large (48px)
size="xl"  // Extra large (64px)
```

---

## ✅ Best Practices

1. **Always use `finally` blocks**
   ```tsx
   try {
     await action();
   } finally {
     setLoading(false); // Always runs
   }
   ```

2. **Match skeleton to content**
   ```tsx
   <PageSkeleton layout="table" /> // For tables
   <PageSkeleton layout="card" />  // For card grids
   ```

3. **Descriptive loading text**
   ```tsx
   loadingText="Saving..."      // ✅ Good
   loadingText="Please wait..." // ❌ Generic
   ```

4. **Use GlobalLoader sparingly**
   - Only for truly global operations
   - Page transitions
   - Heavy background tasks

5. **Disable fields during loading**
   ```tsx
   <input disabled={submitting} />
   ```

---

## 🚫 Common Mistakes

### ❌ Forgetting finally block
```tsx
// BAD
try {
  await action();
  setLoading(false); // Won't run if error!
} catch (error) {
  // ...
}

// GOOD
try {
  await action();
} finally {
  setLoading(false); // Always runs
}
```

### ❌ Wrong skeleton layout
```tsx
// BAD - Using list for a table
{loading ? <PageSkeleton layout="list" /> : <Table />}

// GOOD
{loading ? <PageSkeleton layout="table" /> : <Table />}
```

### ❌ Not disabling inputs
```tsx
// BAD
<input value={value} onChange={onChange} />
<ButtonLoader loading={true} />

// GOOD
<input value={value} onChange={onChange} disabled={loading} />
<ButtonLoader loading={loading} />
```

---

## 📱 Responsive Tips

All components are responsive by default, but you can enhance:

```tsx
{/* Full width on mobile */}
<ButtonLoader fullWidth className="sm:w-auto" />

{/* Adjust skeleton count */}
<PageSkeleton 
  count={window.innerWidth < 768 ? 3 : 8} 
  layout="card" 
/>
```

---

## 🎯 Performance Tips

1. **Memoize handlers**
   ```tsx
   const handleSubmit = useCallback(async () => {
     // ...
   }, [deps]);
   ```

2. **Debounce rapid actions**
   ```tsx
   const debouncedSearch = useMemo(
     () => debounce(handleSearch, 300),
     []
   );
   ```

3. **Lazy load GlobalLoader**
   - Already optimized with context

---

## 🔧 TypeScript Tips

```tsx
// Import types
import type { ButtonLoaderProps } from './components/loading';

// Extend props
interface MyButtonProps extends ButtonLoaderProps {
  customProp: string;
}

// Type the hook return
const loaderState: {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isVisible: boolean;
} = useGlobalLoader();
```

---

## 📊 Cheat Sheet Summary

| Need | Component | Example |
|------|-----------|---------|
| Small inline loader | Spinner | `<Spinner size="sm" />` |
| Action button | ButtonLoader | `<ButtonLoader loading={...} />` |
| Page loading | PageSkeleton | `<PageSkeleton layout="table" />` |
| Full screen | useGlobalLoader | `showLoader()` |
| Form submission | ButtonLoader | `type="submit" form="id"` |

---

## 🎉 You're Ready!

Keep this file handy for quick reference. For detailed examples, see:
- `INTEGRATION_EXAMPLES.tsx` - 10 practical examples
- `README.md` - Complete documentation
- `MentorManagement.REFACTORED.tsx` - Real-world integration

Happy coding! 🚀
