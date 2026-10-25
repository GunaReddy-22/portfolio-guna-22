import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Sparkles,
  Star,
  Share2,
  Inbox,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

const TEMPLATES: Record<string, any> = {
  app_beta: {
    title: 'App Beta Feedback',
    slug: 'app-beta-feedback',
    description: 'Help me test and improve this application! Share your honest thoughts, report any bugs, or suggest features.',
    submitButtonText: 'Submit App Feedback',
    successMessage: 'Thank you for testing the app! Your feedback is invaluable and helps shape the next release.',
    fields: [
      { id: 'f_rating', name: 'overall_rating', label: 'Overall App Experience', type: 'rating', required: true, helpText: 'Rate your overall impression from 1 to 5 stars' },
      { id: 'f_version', name: 'app_version', label: 'App Version / OS', type: 'text', required: false, placeholder: 'e.g. Android 14 / Chrome v122 / Web', helpText: 'What device or browser did you use?' },
      { id: 'f_pros', name: 'favorite_features', label: 'What worked well or was your favorite part?', type: 'textarea', required: true, placeholder: 'Describe what you enjoyed or what felt smooth...' },
      { id: 'f_cons', name: 'issues_and_friction', label: 'What felt slow, confusing, or broken?', type: 'textarea', required: false, placeholder: 'Any bugs, crashes, or awkward UI interactions...' },
      { id: 'f_requests', name: 'feature_requests', label: 'Any feature you would love to see added?', type: 'textarea', required: false, placeholder: 'Ideas or improvements for future updates...' },
      { id: 'f_email', name: 'tester_email', label: 'Your Email (Optional)', type: 'email', required: false, placeholder: 'name@example.com', helpText: 'Optional if you would like me to follow up' },
    ],
  },
  quick_review: {
    title: 'Quick 1-Minute App Review',
    slug: 'quick-app-review',
    description: 'Take 60 seconds to share quick feedback on this build.',
    submitButtonText: 'Send Review',
    successMessage: 'Awesome! Thanks for taking the time to share your review.',
    fields: [
      { id: 'f_rating', name: 'satisfaction', label: 'How would you rate this app?', type: 'rating', required: true },
      { id: 'f_improve', name: 'one_thing_to_improve', label: 'What is one thing that could be improved?', type: 'textarea', required: true, placeholder: 'Be as honest as possible...' },
      { id: 'f_recommend', name: 'would_recommend', label: 'Would you recommend this app to colleagues?', type: 'select', required: true, options: ['Definitely Yes', 'Probably', 'Not Sure', 'No'] },
      { id: 'f_contact', name: 'contact_info', label: 'Your Name or Email (Optional)', type: 'text', required: false, placeholder: 'Jane Doe or jane@example.com' },
    ],
  },
  bug_report: {
    title: 'Bug & Issue Report Form',
    slug: 'bug-report',
    description: 'Encountered an issue or glitch in the app? Please report it here so I can investigate and fix it.',
    submitButtonText: 'Report Issue',
    successMessage: 'Bug report received! Thank you for helping squash issues.',
    fields: [
      { id: 'f_app', name: 'app_name', label: 'Application Name & Version', type: 'text', required: true, placeholder: 'e.g. Zenith Mobile v1.2.0' },
      { id: 'f_severity', name: 'severity', label: 'Issue Severity', type: 'select', required: true, options: ['Cosmetic / Minor Glitch', 'Feature Not Working Properly', 'App Crash / Freezing', 'Data Loss / Critical'] },
      { id: 'f_summary', name: 'summary', label: 'Summary of the Problem', type: 'text', required: true, placeholder: 'Short 1-sentence description of the issue' },
      { id: 'f_steps', name: 'steps_to_reproduce', label: 'Steps to Reproduce', type: 'textarea', required: true, placeholder: '1. Tap on Settings\n2. Click Save\n3. App crashes' },
      { id: 'f_device', name: 'device_specs', label: 'Device & OS Version', type: 'text', required: false, placeholder: 'e.g. Pixel 8, Android 14 / MacBook Air M2' },
      { id: 'f_email', name: 'reporter_email', label: 'Your Email', type: 'email', required: false, placeholder: 'For notification once fixed' },
    ],
  },
  client_review: {
    title: 'Client Project Feedback & Testimonial',
    slug: 'client-feedback',
    description: 'Thank you for collaborating! Please share your thoughts on the project delivery, code quality, and experience.',
    submitButtonText: 'Submit Client Review',
    successMessage: 'Thank you! Your feedback and testimonial are deeply appreciated.',
    fields: [
      { id: 'f_rating', name: 'overall_satisfaction', label: 'Overall Satisfaction', type: 'rating', required: true },
      { id: 'f_quality', name: 'code_and_product_quality', label: 'Product & Code Quality', type: 'rating', required: true },
      { id: 'f_delivery', name: 'delivery_speed_communication', label: 'Communication & Delivery Speed', type: 'rating', required: true },
      { id: 'f_testimonial', name: 'testimonial', label: 'Testimonial / Review Quote', type: 'textarea', required: true, placeholder: 'A short sentence or paragraph about working with Guna Kovvuri...' },
      { id: 'f_name', name: 'client_name', label: 'Your Name & Title', type: 'text', required: true, placeholder: 'Alex Smith, Head of Engineering' },
      { id: 'f_company', name: 'company_name', label: 'Company / Project Name', type: 'text', required: false, placeholder: 'Acme Corp' },
    ],
  },
  access_request: {
    title: 'App Access & Early Beta Request',
    slug: 'app-access-request',
    description: 'Request early access credentials to test our application before public release.',
    formType: 'access_request',
    showHomeButton: false,
    showPill: true,
    pillText: 'Early Access Request · Closed Beta',
    showEyebrow: true,
    eyebrowText: 'Application Access · Verification',
    submitButtonText: 'Request Access',
    successMessage: 'Access request submitted! Your details have been recorded and we will reach out shortly.',
    fields: [
      { id: 'f_name', name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Guna Reddy' },
      { id: 'f_email', name: 'email', label: 'Your Email Address', type: 'email', required: true, placeholder: 'name@example.com', helpText: 'Access credentials and updates will be sent to this email' },
      { id: 'f_org', name: 'organization_roll', label: 'College / Organization / Roll Number', type: 'text', required: false, placeholder: 'e.g. NIT Delhi' },
      { id: 'f_platform', name: 'target_platform', label: 'Device Platform', type: 'select', required: true, options: ['Android Phone', 'iPhone / iOS', 'Web Browser', 'Desktop (Windows / Mac)'] },
      { id: 'f_reason', name: 'intended_use', label: 'Reason for Access / Additional Notes', type: 'textarea', required: false, placeholder: 'Tell us a bit about why you need access...' },
    ],
  },
  general_form: {
    title: 'General Contact & Information Form',
    slug: 'contact-form',
    description: 'Please submit your details or inquiries using this form.',
    formType: 'general',
    showHomeButton: true,
    showPill: true,
    pillText: 'Public Form · Direct Submission',
    showEyebrow: true,
    eyebrowText: 'Information · Online Submission',
    submitButtonText: 'Submit Form',
    successMessage: 'Thank you! Your submission has been received successfully.',
    fields: [
      { id: 'f_name', name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your Name' },
      { id: 'f_email', name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
      { id: 'f_msg', name: 'message', label: 'Message / Details', type: 'textarea', required: true, placeholder: 'Write your message or inquiry here...' },
    ],
  },
};

export const FormsManager: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailModalForm, setEmailModalForm] = useState<any | null>(null);
  const [copiedLinkSlug, setCopiedLinkSlug] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const originUrl = window.location.origin;

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await api.getForms();
      setForms(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleOpenCreateWithTemplate = (templateKey: string) => {
    const tmpl = TEMPLATES[templateKey];
    if (tmpl) {
      setEditingForm({
        title: tmpl.title,
        slug: `${tmpl.slug}-${Math.floor(Math.random() * 900 + 100)}`,
        description: tmpl.description,
        isActive: true,
        formType: tmpl.formType || 'general',
        showHomeButton: tmpl.showHomeButton !== false,
        showPill: tmpl.showPill !== false,
        pillText: tmpl.pillText || '',
        showEyebrow: tmpl.showEyebrow !== false,
        eyebrowText: tmpl.eyebrowText || '',
        submitButtonText: tmpl.submitButtonText || 'Submit',
        successMessage: tmpl.successMessage || 'Thank you for your submission!',
        notificationEmail: '',
        fields: JSON.parse(JSON.stringify(tmpl.fields)),
      });
    } else {
      setEditingForm({
        title: 'New Custom Form',
        slug: `form-${Date.now().toString().slice(-4)}`,
        description: '',
        isActive: true,
        formType: 'general',
        showHomeButton: true,
        showPill: true,
        pillText: 'Public Form · No Login Required',
        showEyebrow: true,
        eyebrowText: 'Online Form · Submission',
        submitButtonText: 'Submit',
        successMessage: 'Thank you for your submission!',
        notificationEmail: '',
        fields: [
          { id: `f_${Date.now()}_1`, name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your Name' },
          { id: `f_${Date.now()}_2`, name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' },
          { id: `f_${Date.now()}_3`, name: 'notes', label: 'Notes / Comments', type: 'textarea', required: false, placeholder: 'Write your notes or message here...' },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (form: any) => {
    setEditingForm({
      _id: form._id || form.id,
      id: form.id || form._id,
      title: form.title || form.name || 'Untitled Form',
      slug: form.slug,
      description: form.description || '',
      isActive: form.isActive !== false,
      formType: form.formType || 'general',
      showHomeButton: form.showHomeButton !== false,
      showPill: form.showPill !== false,
      pillText: form.pillText || '',
      showEyebrow: form.showEyebrow !== false,
      eyebrowText: form.eyebrowText || '',
      submitButtonText: form.submitButtonText || 'Submit',
      successMessage: form.successMessage || 'Thank you for your submission!',
      notificationEmail: form.notificationEmail || '',
      fields: form.fields ? JSON.parse(JSON.stringify(form.fields)) : [],
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;

    try {
      if (editingForm._id) {
        await api.updateForm(editingForm._id, editingForm);
        setSuccessMsg(`Feedback form "${editingForm.title}" updated successfully.`);
      } else {
        await api.createForm(editingForm);
        setSuccessMsg(`Feedback form "${editingForm.title}" created successfully.`);
      }
      setIsModalOpen(false);
      setEditingForm(null);
      await loadForms();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save feedback form');
    }
  };

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${formTitle}"? Existing responses will remain safe in the database.`)) return;
    try {
      await api.deleteForm(formId);
      setSuccessMsg(`Deleted form "${formTitle}".`);
      await loadForms();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCopyLink = (formOrSlug: any) => {
    let slug = '';
    let publicUrl = '';
    if (typeof formOrSlug === 'string') {
      slug = formOrSlug;
      publicUrl = `https://forms.gunasai.in/${slug}`;
    } else if (formOrSlug && typeof formOrSlug === 'object') {
      slug = formOrSlug.slug;
      publicUrl = formOrSlug.publicUrl || `https://forms.gunasai.in/${slug}`;
    }
    navigator.clipboard.writeText(publicUrl);
    setCopiedLinkSlug(slug);
    setSuccessMsg(`Copied shareable link: ${publicUrl}`);
    setTimeout(() => {
      setCopiedLinkSlug(null);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleAddField = () => {
    if (!editingForm) return;
    const newId = `field_${Date.now()}`;
    setEditingForm({
      ...editingForm,
      fields: [
        ...editingForm.fields,
        { id: newId, name: `field_${editingForm.fields.length + 1}`, label: 'New Question', type: 'text', required: false, placeholder: '' },
      ],
    });
  };

  const handleRemoveField = (idx: number) => {
    if (!editingForm) return;
    const fields = editingForm.fields.filter((_: any, i: number) => i !== idx);
    setEditingForm({ ...editingForm, fields });
  };

  const handleMoveField = (idx: number, direction: 'up' | 'down') => {
    if (!editingForm) return;
    const fields = [...editingForm.fields];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[idx];
    fields[idx] = fields[targetIdx];
    fields[targetIdx] = temp;
    setEditingForm({ ...editingForm, fields });
  };

  const getEmailInvitationBody = (form: any) => {
    const publicUrl = form.publicUrl || `https://forms.gunasai.in/${form.slug}`;
    return `Subject: Quick Feedback on ${form.title || 'Our App'}\n\nHi there,\n\nI've recently updated ${form.title || 'our application'} and would love to hear your thoughts and suggestions.\n\nCould you please take 1-2 minutes to fill out this quick feedback form?\n👉 ${publicUrl}\n\nNo sign-up or login required — your feedback directly helps improve the next version.\n\nThank you for your time and support!\n\nBest regards,\nGuna Kovvuri`;
  };

  const handleCopyEmailText = (form: any) => {
    const text = getEmailInvitationBody(form);
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={22} color="var(--cms-amber)" />
            Feedback Forms & Questionnaires
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Create app feedback forms, generate instant shareable links for testers and clients, and collect responses with zero login barriers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenCreateWithTemplate('app_beta')}
            className="cms-btn cms-btn-primary"
            style={{ background: 'linear-gradient(135deg, var(--cms-amber), #ea580c)', color: '#000', fontWeight: 700 }}
          >
            <Sparkles size={16} />
            <span>Create App Feedback Form</span>
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('custom')}
            className="cms-btn cms-btn-secondary"
          >
            <Plus size={16} />
            <span>Custom Form</span>
          </button>
        </div>
      </div>

      {/* Preset Templates Banner */}
      <div
        className="cms-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(6, 182, 212, 0.04))',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
            <Star size={16} fill="#fbbf24" />
            <span>Quick Start Templates</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', marginTop: '0.2rem' }}>
            Pre-built questions with 5-star ratings, bug reports, and client testimonials.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleOpenCreateWithTemplate('app_beta')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
          >
            🚀 App Beta Tester
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('access_request')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
            style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}
          >
            🔑 Access Request Form
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('general_form')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
          >
            📝 Normal / Custom Form
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('quick_review')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
          >
            ⭐ 1-Min Review
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('bug_report')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
          >
            🐛 Bug Report
          </button>
          <button
            onClick={() => handleOpenCreateWithTemplate('client_review')}
            className="cms-btn cms-btn-sm cms-btn-secondary"
          >
            💼 Client Review
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="cms-alert cms-alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="cms-alert cms-alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Forms Table */}
      {loading ? (
        <CmsLoadingState
          title="Loading Feedback Forms..."
          subtitle="Fetching configured forms, rating fields, and submission endpoints"
        />
      ) : forms.length === 0 ? (
        <div className="cms-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          <CheckSquare size={38} color="var(--cms-amber)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0 0 0.5rem 0' }}>No Feedback Forms Created Yet</h3>
          <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
            Create a feedback form for your apps. The system generates a public link you can email to anyone to collect responses.
          </p>
          <button onClick={() => handleOpenCreateWithTemplate('app_beta')} className="cms-btn cms-btn-primary">
            <Sparkles size={16} />
            <span>Create Your First Feedback Form</span>
          </button>
        </div>
      ) : (
        <div className="cms-table-container">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Feedback Form</th>
                <th>Public Shareable Link</th>
                <th>Responses</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => {
                const publicUrl = form.publicUrl || `https://forms.gunasai.in/${form.slug}`;
                const localPreviewUrl = `${originUrl}/feedback/${form.slug}`;
                const hasUnread = (form.unreadCount || 0) > 0;

                return (
                  <tr key={form.id || form._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--cms-text)', fontSize: '0.95rem' }}>
                        {form.title || form.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', marginTop: '0.2rem', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {form.description || `${form.fields?.length || 0} questions configured`}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '4px',
                            border: '1px solid var(--cms-border)',
                            color: 'var(--cms-amber)',
                          }}
                        >
                          forms.gunasai.in/{form.slug}
                        </code>
                        <button
                          onClick={() => handleCopyLink(form)}
                          className="cms-btn cms-btn-secondary cms-btn-sm cms-btn-icon"
                          title="Copy Link to Clipboard (https://forms.gunasai.in/...)"
                        >
                          {copiedLinkSlug === form.slug ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                        <a
                          href={originUrl.includes('localhost') ? localPreviewUrl : publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon"
                          title={originUrl.includes('localhost') ? "Preview Form (Localhost)" : "Open Form (forms.gunasai.in)"}
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/submissions?formId=${form.id || form._id}`)}
                        className="cms-btn cms-btn-ghost cms-btn-sm"
                        style={{
                          padding: '0.35rem 0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: hasUnread ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)',
                          border: hasUnread ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--cms-border)',
                          color: hasUnread ? '#fbbf24' : 'var(--cms-text)',
                          fontWeight: 600,
                        }}
                      >
                        <Inbox size={14} />
                        <span>{form.responseCount || 0} Responses</span>
                        {hasUnread && (
                          <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 800 }}>
                            {form.unreadCount} new
                          </span>
                        )}
                      </button>
                    </td>
                    <td>
                      <span className={`cms-badge ${form.isActive ? 'cms-badge-green' : 'cms-badge-gray'}`}>
                        {form.isActive ? 'Active • Accepting' : 'Paused'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setEmailModalForm(form)}
                          className="cms-btn cms-btn-secondary cms-btn-sm"
                          title="Copy Email Invitation Message"
                        >
                          <Mail size={13} />
                          <span>Email Invite</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(form)}
                          className="cms-btn cms-btn-secondary cms-btn-sm"
                          title="Edit Form Questions"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id || form._id, form.title || form.name)}
                          className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                          title="Delete Form"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Share / Email Invitation Modal */}
      {emailModalForm && (
        <div className="cms-modal-backdrop" onClick={() => setEmailModalForm(null)}>
          <div className="cms-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="var(--cms-amber)" />
                Share Feedback Form Link via Email
              </h3>
              <button className="cms-btn cms-btn-icon cms-btn-ghost" onClick={() => setEmailModalForm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="cms-modal-body">
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="cms-label">Direct Public Shareable Link (forms.gunasai.in)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    className="cms-input"
                    value={emailModalForm.publicUrl || `https://forms.gunasai.in/${emailModalForm.slug}`}
                    style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(emailModalForm)}
                    className="cms-btn cms-btn-primary"
                  >
                    <Copy size={15} /> Copy Link
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted)', marginTop: '0.35rem' }}>
                  Anyone with this link can fill out the form directly without any login requirement.
                </div>
              </div>

              <div>
                <label className="cms-label">Ready-to-Send Email Template</label>
                <textarea
                  readOnly
                  rows={9}
                  className="cms-textarea"
                  style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '0.82rem', lineHeight: 1.45 }}
                  value={getEmailInvitationBody(emailModalForm)}
                />
              </div>
            </div>
            <div className="cms-modal-footer">
              <a
                href={`${originUrl}/feedback/${emailModalForm.slug}`}
                target="_blank"
                rel="noreferrer"
                className="cms-btn cms-btn-ghost"
              >
                <Eye size={15} /> Local Preview
              </a>
              <button
                type="button"
                onClick={() => handleCopyEmailText(emailModalForm)}
                className="cms-btn cms-btn-primary"
              >
                {copiedEmail ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Invitation Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Form Modal */}
      {isModalOpen && editingForm && (
        <div className="cms-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cms-modal" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {editingForm._id ? 'Edit Form' : 'Create New Form'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                  Configure your questions, fields, page header, and shareable public settings.
                </div>
              </div>
              <button className="cms-btn cms-btn-icon cms-btn-ghost" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="cms-modal-body">
                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Form Title</label>
                    <input
                      type="text"
                      className="cms-input"
                      value={editingForm.title}
                      placeholder="e.g. Bunk360 - Access Request Form"
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        const autoSlug = editingForm._id
                          ? editingForm.slug
                          : newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                        setEditingForm({ ...editingForm, title: newTitle, slug: autoSlug });
                      }}
                      required
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Public Link Slug</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="cms-input"
                        value={editingForm.slug}
                        placeholder="e.g. bunk360-access"
                        onChange={(e) => setEditingForm({ ...editingForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                        required
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>
                      Public Link: https://forms.gunasai.in/{editingForm.slug || 'slug'}
                    </span>
                  </div>
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Description / Subtitle (Optional)</label>
                  <textarea
                    className="cms-textarea"
                    rows={2}
                    value={editingForm.description || ''}
                    placeholder="Provide instructions or description for visitors..."
                    onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                  />
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Submit Button Label</label>
                    <input
                      type="text"
                      className="cms-input"
                      value={editingForm.submitButtonText || 'Submit'}
                      onChange={(e) => setEditingForm({ ...editingForm, submitButtonText: e.target.value })}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Success Message</label>
                    <input
                      type="text"
                      className="cms-input"
                      value={editingForm.successMessage || ''}
                      placeholder="Thank you for your submission!"
                      onChange={(e) => setEditingForm({ ...editingForm, successMessage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Alert Notification Email (Optional)</label>
                    <input
                      type="email"
                      className="cms-input"
                      value={editingForm.notificationEmail || ''}
                      placeholder="kovvuri@gunasai.in (optional)"
                      onChange={(e) => setEditingForm({ ...editingForm, notificationEmail: e.target.value })}
                    />
                  </div>
                  <div className="cms-form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editingForm.isActive}
                        onChange={(e) => setEditingForm({ ...editingForm, isActive: e.target.checked })}
                      />
                      <span>Active &amp; Accepting Submissions</span>
                    </label>
                  </div>
                </div>

                {/* Page Layout & Header Customization Controls */}
                <div
                  style={{
                    margin: '1.25rem 0',
                    padding: '1.1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid var(--cms-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cms-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} />
                      Page Layout &amp; Header Settings
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>
                      Control top navigation button and headings
                    </span>
                  </div>

                  {/* Portfolio Home Visibility & Form Category */}
                  <div className="cms-form-row" style={{ marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div className="cms-form-group" style={{ marginBottom: 0, flex: 1.1 }}>
                      <label className="cms-label">Form Purpose / Category</label>
                      <select
                        className="cms-input"
                        value={editingForm.formType || 'general'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingForm({
                            ...editingForm,
                            formType: val,
                            pillText: editingForm.pillText || (val === 'access_request' ? 'Access Request Form · Closed Beta' : val === 'feedback' ? 'Public Feedback Form · No Login Required' : 'Public Form · No Login Required'),
                            eyebrowText: editingForm.eyebrowText || (val === 'access_request' ? 'Application · Access Request' : val === 'feedback' ? 'Application Feedback · Review' : 'Online Form · Submission'),
                          });
                        }}
                      >
                        <option value="general">Normal / Custom Form</option>
                        <option value="access_request">Access Request / Early Beta Form</option>
                        <option value="feedback">User Feedback Form</option>
                        <option value="contact">Contact &amp; Inquiry Form</option>
                      </select>
                    </div>

                    <div className="cms-form-group" style={{ marginBottom: 0, flex: 1.3 }}>
                      <label className="cms-label">Portfolio Home Navigation Link</label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--cms-border)',
                        }}
                      >
                        <input
                          type="checkbox"
                          id="chk_show_home"
                          style={{ accentColor: 'var(--cms-amber)', width: '16px', height: '16px', cursor: 'pointer' }}
                          checked={editingForm.showHomeButton !== false}
                          onChange={(e) => setEditingForm({ ...editingForm, showHomeButton: e.target.checked })}
                        />
                        <label htmlFor="chk_show_home" style={{ cursor: 'pointer', margin: 0, fontSize: '0.84rem' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>Show &ldquo;Portfolio Home ↗&rdquo; Button</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>
                            {editingForm.showHomeButton !== false ? 'Visible in top right navbar' : 'Hidden from public navbar'}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Top Status Badge Pill */}
                  <div className="cms-form-row" style={{ marginBottom: '0.85rem' }}>
                    <div className="cms-form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            style={{ accentColor: 'var(--cms-amber)', width: '15px', height: '15px' }}
                            checked={editingForm.showPill !== false}
                            onChange={(e) => setEditingForm({ ...editingForm, showPill: e.target.checked })}
                          />
                          <span className="cms-label" style={{ margin: 0, fontWeight: 600 }}>Top Status Badge Pill</span>
                        </label>
                        <span style={{ fontSize: '0.72rem', color: editingForm.showPill !== false ? 'var(--cms-amber)' : 'var(--cms-text-muted)' }}>
                          {editingForm.showPill !== false ? 'Enabled' : 'Hidden'}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="cms-input"
                        disabled={editingForm.showPill === false}
                        placeholder="e.g. Access Request Form · No Login Required"
                        value={editingForm.pillText || ''}
                        onChange={(e) => setEditingForm({ ...editingForm, pillText: e.target.value })}
                        style={{ opacity: editingForm.showPill === false ? 0.4 : 1 }}
                      />
                    </div>

                    {/* Top Eyebrow Subheading */}
                    <div className="cms-form-group" style={{ marginBottom: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                          <input
                            type="checkbox"
                            style={{ accentColor: 'var(--cms-amber)', width: '15px', height: '15px' }}
                            checked={editingForm.showEyebrow !== false}
                            onChange={(e) => setEditingForm({ ...editingForm, showEyebrow: e.target.checked })}
                          />
                          <span className="cms-label" style={{ margin: 0, fontWeight: 600 }}>Eyebrow Subheading</span>
                        </label>
                        <span style={{ fontSize: '0.72rem', color: editingForm.showEyebrow !== false ? 'var(--cms-amber)' : 'var(--cms-text-muted)' }}>
                          {editingForm.showEyebrow !== false ? 'Enabled' : 'Hidden'}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="cms-input"
                        disabled={editingForm.showEyebrow === false}
                        placeholder="e.g. Application Access · Verification"
                        value={editingForm.eyebrowText || ''}
                        onChange={(e) => setEditingForm({ ...editingForm, eyebrowText: e.target.value })}
                        style={{ opacity: editingForm.showEyebrow === false ? 0.4 : 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Question Fields Builder */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--cms-border)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                        Questions & Input Fields ({editingForm.fields?.length || 0})
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                        Add rating stars, text boxes, and select menus.
                      </div>
                    </div>
                    <button type="button" onClick={handleAddField} className="cms-btn cms-btn-primary cms-btn-sm">
                      <Plus size={14} /> Add Question
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {editingForm.fields?.map((field: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--cms-radius-md)',
                          border: '1px solid var(--cms-border)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cms-amber)', width: '24px' }}>
                            #{idx + 1}
                          </span>
                          <input
                            type="text"
                            className="cms-input"
                            style={{ flex: 3, fontWeight: 600 }}
                            placeholder="Question label (e.g. How smooth was the UI?)"
                            value={field.label}
                            onChange={(e) => {
                              const fields = [...editingForm.fields];
                              fields[idx].label = e.target.value;
                              if (!editingForm._id && !fields[idx].nameCustomized) {
                                fields[idx].name = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
                              }
                              setEditingForm({ ...editingForm, fields });
                            }}
                            required
                          />
                          <select
                            className="cms-select"
                            style={{ flex: 2 }}
                            value={field.type}
                            onChange={(e) => {
                              const fields = [...editingForm.fields];
                              fields[idx].type = e.target.value;
                              setEditingForm({ ...editingForm, fields });
                            }}
                          >
                            <option value="rating">⭐ 5-Star Rating</option>
                            <option value="text">Single Line Text</option>
                            <option value="textarea">Multi-line Textarea</option>
                            <option value="email">Email Address</option>
                            <option value="select">Dropdown Menu</option>
                            <option value="checkbox">Checkbox Option</option>
                            <option value="number">Number</option>
                            <option value="url">URL Link</option>
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const fields = [...editingForm.fields];
                                fields[idx].required = e.target.checked;
                                setEditingForm({ ...editingForm, fields });
                              }}
                            />
                            Required
                          </label>

                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'up')}
                              disabled={idx === 0}
                              className="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon"
                              title="Move Question Up"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'down')}
                              disabled={idx === editingForm.fields.length - 1}
                              className="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon"
                              title="Move Question Down"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(idx)}
                              className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                              title="Delete Question"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="cms-input"
                            style={{ flex: 1, fontSize: '0.78rem', color: 'var(--cms-text-muted)', fontFamily: 'var(--cms-font-mono)' }}
                            placeholder="field_key_name"
                            value={field.name}
                            onChange={(e) => {
                              const fields = [...editingForm.fields];
                              fields[idx].name = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                              fields[idx].nameCustomized = true;
                              setEditingForm({ ...editingForm, fields });
                            }}
                          />
                          <input
                            type="text"
                            className="cms-input"
                            style={{ flex: 2, fontSize: '0.8rem' }}
                            placeholder="Help text or placeholder (optional)"
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const fields = [...editingForm.fields];
                              fields[idx].placeholder = e.target.value;
                              setEditingForm({ ...editingForm, fields });
                            }}
                          />
                        </div>

                        {field.type === 'select' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                              Dropdown Options (comma-separated):
                            </label>
                            <input
                              type="text"
                              className="cms-input"
                              style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}
                              value={(field.options || []).join(', ')}
                              placeholder="e.g. Excellent, Good, Average, Poor"
                              onChange={(e) => {
                                const fields = [...editingForm.fields];
                                fields[idx].options = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                setEditingForm({ ...editingForm, fields });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="cms-modal-footer">
                <button type="button" className="cms-btn cms-btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-btn cms-btn-primary" style={{ fontWeight: 700 }}>
                  Save & Publish Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
