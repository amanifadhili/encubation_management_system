/**
 * Loading Components Test Page
 * 
 * This page helps you verify all loading components are working correctly
 * before implementing them across the application.
 * 
 * Access this page to test:
 * - Spinner (all sizes and colors)
 * - ButtonLoader (all variants)
 * - PageSkeleton (all layouts)
 * - GlobalLoader (overlay)
 */

import { useState, useEffect } from 'react';
import { 
  Spinner, 
  ButtonLoader, 
  PageSkeleton, 
  useGlobalLoader 
} from '../components/loading';

export default function LoadingComponentsTest() {
  const { showLoader, hideLoader } = useGlobalLoader();
  
  // Button loading states
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [outlineLoading, setOutlineLoading] = useState(false);
  
  // Skeleton states
  const [listLoading, setListLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(true);

  useEffect(() => {
    // Auto-hide skeletons after 3 seconds
    const timer = setTimeout(() => {
      setListLoading(false);
      setTableLoading(false);
      setCardLoading(false);
      setFormLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const simulateLoading = (setter: (value: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const testGlobalLoader = () => {
    showLoader('Testing Global Loader...');
    setTimeout(() => {
      hideLoader();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Loading Components Test Suite
          </h1>
          <p className="text-gray-600">
            Test all loading components before implementing them across the app.
            All components should work smoothly without errors.
          </p>
        </div>

        {/* 1. Spinner Tests */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            1. Spinner Component
          </h2>

          <div className="space-y-6">
            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Sizes</h3>
              <div className="flex gap-6 items-center bg-gray-50 p-4 rounded">
                <div className="text-center">
                  <Spinner size="xs" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">XS</p>
                </div>
                <div className="text-center">
                  <Spinner size="sm" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">SM</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">MD</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">LG</p>
                </div>
                <div className="text-center">
                  <Spinner size="xl" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">XL</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Colors</h3>
              <div className="flex gap-6 items-center bg-gray-50 p-4 rounded">
                <div className="text-center">
                  <Spinner size="md" color="blue" />
                  <p className="text-xs mt-2 text-gray-600">Blue</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" color="green" />
                  <p className="text-xs mt-2 text-gray-600">Green</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" color="red" />
                  <p className="text-xs mt-2 text-gray-600">Red</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" color="yellow" />
                  <p className="text-xs mt-2 text-gray-600">Yellow</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" color="gray" />
                  <p className="text-xs mt-2 text-gray-600">Gray</p>
                </div>
                <div className="text-center bg-gray-800 p-2 rounded">
                  <Spinner size="md" color="white" />
                  <p className="text-xs mt-2 text-white">White</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✅ <strong>Expected:</strong> All spinners should rotate smoothly
            </p>
          </div>
        </section>

        {/* 2. ButtonLoader Tests */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            2. ButtonLoader Component
          </h2>

          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <ButtonLoader
                  loading={primaryLoading}
                  onClick={() => simulateLoading(setPrimaryLoading)}
                  label="Primary Button"
                  loadingText="Loading..."
                  variant="primary"
                />
                <ButtonLoader
                  loading={secondaryLoading}
                  onClick={() => simulateLoading(setSecondaryLoading)}
                  label="Secondary Button"
                  loadingText="Loading..."
                  variant="secondary"
                />
                <ButtonLoader
                  loading={dangerLoading}
                  onClick={() => simulateLoading(setDangerLoading)}
                  label="Danger Button"
                  loadingText="Deleting..."
                  variant="danger"
                />
                <ButtonLoader
                  loading={successLoading}
                  onClick={() => simulateLoading(setSuccessLoading)}
                  label="Success Button"
                  loadingText="Saving..."
                  variant="success"
                />
                <ButtonLoader
                  loading={outlineLoading}
                  onClick={() => simulateLoading(setOutlineLoading)}
                  label="Outline Button"
                  loadingText="Processing..."
                  variant="outline"
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Sizes</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <ButtonLoader
                  loading={false}
                  label="Small Button"
                  variant="primary"
                  size="sm"
                />
                <ButtonLoader
                  loading={false}
                  label="Medium Button"
                  variant="primary"
                  size="md"
                />
                <ButtonLoader
                  loading={false}
                  label="Large Button"
                  variant="primary"
                  size="lg"
                />
              </div>
            </div>

            {/* Full Width */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Full Width</h3>
              <ButtonLoader
                loading={false}
                label="Full Width Button"
                variant="primary"
                fullWidth
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✅ <strong>Expected:</strong> Buttons should show spinner and change text when clicked, then reset after 2 seconds
            </p>
          </div>
        </section>

        {/* 3. PageSkeleton Tests */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            3. PageSkeleton Component
          </h2>

          <div className="space-y-8">
            {/* List Layout */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">List Layout</h3>
                <button
                  onClick={() => {
                    setListLoading(true);
                    setTimeout(() => setListLoading(false), 3000);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload
                </button>
              </div>
              {listLoading ? (
                <PageSkeleton count={3} layout="list" />
              ) : (
                <div className="space-y-3">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Item 1</h4>
                    <p className="text-gray-600">This is the actual content</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Item 2</h4>
                    <p className="text-gray-600">This is the actual content</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Item 3</h4>
                    <p className="text-gray-600">This is the actual content</p>
                  </div>
                </div>
              )}
            </div>

            {/* Table Layout */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Table Layout</h3>
                <button
                  onClick={() => {
                    setTableLoading(true);
                    setTimeout(() => setTableLoading(false), 3000);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload
                </button>
              </div>
              {tableLoading ? (
                <PageSkeleton count={4} layout="table" />
              ) : (
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map(i => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="p-3">User {i}</td>
                        <td className="p-3">user{i}@example.com</td>
                        <td className="p-3">Role {i}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Card Layout */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Card Layout</h3>
                <button
                  onClick={() => {
                    setCardLoading(true);
                    setTimeout(() => setCardLoading(false), 3000);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload
                </button>
              </div>
              {cardLoading ? (
                <PageSkeleton count={3} layout="card" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4" />
                      <h4 className="font-semibold text-gray-900">Card {i}</h4>
                      <p className="text-gray-600 text-sm mt-2">Card content here</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Layout */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">Form Layout</h3>
                <button
                  onClick={() => {
                    setFormLoading(true);
                    setTimeout(() => setFormLoading(false), 3000);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Reload
                </button>
              </div>
              {formLoading ? (
                <PageSkeleton count={3} layout="form" />
              ) : (
                <div className="space-y-4">
                  {['Name', 'Email', 'Phone'].map((field, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field}
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={`Enter ${field.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✅ <strong>Expected:</strong> Skeletons should pulse, then transition smoothly to actual content
            </p>
          </div>
        </section>

        {/* 4. GlobalLoader Test */}
        <section className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            4. GlobalLoader Component
          </h2>

          <div>
            <p className="text-gray-600 mb-4">
              Click the button below to test the full-screen overlay loader.
              It should appear for 3 seconds then disappear.
            </p>
            
            <ButtonLoader
              loading={false}
              onClick={testGlobalLoader}
              label="Test Global Loader"
              variant="primary"
              size="lg"
            />
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              ✅ <strong>Expected:</strong> Full-screen overlay with centered spinner and message
            </p>
          </div>
        </section>

        {/* Final Checklist */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            ✅ Testing Checklist
          </h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">All spinners rotate smoothly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">ButtonLoader shows loading state correctly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">PageSkeletons pulse and transition smoothly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">GlobalLoader appears and disappears correctly</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">No console errors</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-blue-900">Mobile view works properly</span>
            </label>
          </div>

          <div className="mt-6 p-4 bg-white rounded border border-blue-300">
            <p className="text-blue-900 font-semibold mb-2">
              🎉 Once all items are checked, you're ready to start the rollout!
            </p>
            <p className="text-sm text-blue-800">
              Mark "Review examples and documentation" and "Set up testing environment" as complete in the rollout plan.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
