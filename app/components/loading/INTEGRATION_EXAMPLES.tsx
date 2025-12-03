/**
 * PRACTICAL INTEGRATION EXAMPLES
 * 
 * This file shows real-world examples of how to integrate the loading components
 * into your existing React components.
 */

import { useState, useEffect } from 'react';
import { ButtonLoader, PageSkeleton, useGlobalLoader, Spinner } from './index';
import axios from 'axios';

// ============================================================================
// EXAMPLE 1: Simple Button Loading
// ============================================================================
export const Example1_ButtonLoading = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.post('/api/save', { data: 'example' });
      console.log('Success!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ButtonLoader
      loading={isSubmitting}
      onClick={handleSubmit}
      label="Save Changes"
      loadingText="Saving..."
      variant="primary"
    />
  );
};

// ============================================================================
// EXAMPLE 2: Page with Skeleton Loading
// ============================================================================
export const Example2_PageLoading = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/mentors');
        setData(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {loading ? (
        <PageSkeleton count={5} layout="table" />
      ) : (
        <table>
          {/* Your data table here */}
          {data.map((item: any) => (
            <tr key={item.id}>
              <td>{item.name}</td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: Multiple Button States
// ============================================================================
export const Example3_MultipleButtons = () => {
  const [assigningMentor, setAssigningMentor] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [savingData, setSavingData] = useState(false);

  return (
    <div className="flex gap-4">
      <ButtonLoader
        loading={assigningMentor}
        onClick={async () => {
          setAssigningMentor(true);
          try {
            await axios.post('/api/assign');
          } finally {
            setAssigningMentor(false);
          }
        }}
        label="Assign Mentor"
        loadingText="Assigning..."
        variant="primary"
      />

      <ButtonLoader
        loading={deletingTeam}
        onClick={async () => {
          setDeletingTeam(true);
          try {
            await axios.delete('/api/teams/1');
          } finally {
            setDeletingTeam(false);
          }
        }}
        label="Delete"
        loadingText="Deleting..."
        variant="danger"
      />

      <ButtonLoader
        loading={savingData}
        onClick={async () => {
          setSavingData(true);
          try {
            await axios.put('/api/save');
          } finally {
            setSavingData(false);
          }
        }}
        label="Save"
        loadingText="Saving..."
        variant="success"
      />
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Global Loader for Navigation
// ============================================================================
export const Example4_GlobalLoader = () => {
  const { showLoader, hideLoader } = useGlobalLoader();

  const handleHeavyOperation = async () => {
    showLoader('Processing your request...');
    try {
      // Simulate heavy operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      await axios.post('/api/heavy-operation');
    } finally {
      hideLoader();
    }
  };

  return (
    <button onClick={handleHeavyOperation}>
      Start Heavy Operation
    </button>
  );
};

// ============================================================================
// EXAMPLE 5: Form with Submit Button
// ============================================================================
export const Example5_FormSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/form', formData);
      alert('Form submitted!');
    } catch (error) {
      alert('Error submitting form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        className="border p-2 rounded"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        className="border p-2 rounded"
      />
      <ButtonLoader
        type="submit"
        loading={submitting}
        label="Submit Form"
        loadingText="Submitting..."
        variant="primary"
        fullWidth
      />
    </form>
  );
};

// ============================================================================
// EXAMPLE 6: Card Grid with Skeleton
// ============================================================================
export const Example6_CardGrid = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const response = await axios.get('/api/teams');
        setTeams(response.data);
      } finally {
        setLoading(false);
      }
    };
    loadTeams();
  }, []);

  return (
    <div>
      {loading ? (
        <PageSkeleton count={6} layout="card" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {teams.map((team: any) => (
            <div key={team.id} className="border p-4 rounded">
              <h3>{team.name}</h3>
              <p>{team.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXAMPLE 7: Inline Spinner
// ============================================================================
export const Example7_InlineSpinner = () => {
  const [loadingStatus, setLoadingStatus] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span>Processing your request</span>
      {loadingStatus && <Spinner size="sm" color="blue" />}
    </div>
  );
};

// ============================================================================
// EXAMPLE 8: Modal with Loading Button
// ============================================================================
export const Example8_ModalForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post('/api/modal-data');
      setIsOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Modal Form</h2>
            <form>
              {/* Form fields */}
            </form>
            <div className="flex gap-2">
              <ButtonLoader
                loading={false}
                onClick={() => setIsOpen(false)}
                label="Cancel"
                variant="secondary"
              />
              <ButtonLoader
                loading={saving}
                onClick={handleSave}
                label="Save"
                loadingText="Saving..."
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// EXAMPLE 9: Table Loading with Different Layouts
// ============================================================================
export const Example9_TableLoading = () => {
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/mentors');
        setMentors(response.data);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, []);

  if (loading) {
    return <PageSkeleton count={8} layout="table" />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Expertise</th>
        </tr>
      </thead>
      <tbody>
        {mentors.map((mentor: any) => (
          <tr key={mentor.id}>
            <td>{mentor.name}</td>
            <td>{mentor.email}</td>
            <td>{mentor.expertise}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================================================
// EXAMPLE 10: Complete Page with All Components
// ============================================================================
export const Example10_CompletePage = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const { showLoader, hideLoader } = useGlobalLoader();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setPageLoading(true);
    try {
      const response = await axios.get('/api/data');
      setData(response.data);
    } finally {
      setPageLoading(false);
    }
  };

  const handleGlobalOperation = async () => {
    showLoader('Syncing with server...');
    try {
      await axios.post('/api/sync');
    } finally {
      hideLoader();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await axios.post('/api/submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await axios.delete(`/api/items/${id}`);
      await loadData();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Page</h1>
        <div className="flex gap-2">
          <ButtonLoader
            loading={false}
            onClick={handleGlobalOperation}
            label="Sync"
            variant="outline"
          />
          <ButtonLoader
            loading={submitting}
            onClick={handleSubmit}
            label="Submit"
            loadingText="Submitting..."
            variant="primary"
          />
        </div>
      </div>

      {pageLoading ? (
        <PageSkeleton count={5} layout="list" />
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.id} className="border p-4 rounded flex justify-between">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ButtonLoader
                loading={deleting}
                onClick={() => handleDelete(item.id)}
                label="Delete"
                loadingText="Deleting..."
                variant="danger"
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BEFORE vs AFTER COMPARISON
// ============================================================================

// ❌ OLD WAY (Without loading system)
export const OldWay = () => {
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch('/api/submit');
        setLoading(false);
      }}
    >
      {loading ? 'Loading...' : 'Submit'}
    </button>
  );
};

// ✅ NEW WAY (With loading system)
export const NewWay = () => {
  const [loading, setLoading] = useState(false);

  return (
    <ButtonLoader
      loading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await fetch('/api/submit');
        } finally {
          setLoading(false);
        }
      }}
      label="Submit"
      loadingText="Submitting..."
      variant="primary"
    />
  );
};
