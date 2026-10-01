/* NEXORA — Sign in with Supabase email/password authentication. */
(() => {
  'use strict';

  const REDIRECT_TO = 'dashboard.html';

  const form = document.getElementById('signin-form');
  if (!form) return;

  const dialog = form.closest('dialog');
  const email = form.elements.namedItem('email');
  const password = form.elements.namedItem('password');
  const submit = form.querySelector('button[type="submit"]');
  const formError = document.getElementById('signin-error');
  const status = document.getElementById('signin-status');
  let busy = false;

  const fieldError = (input, msg) => {
    const el = document.getElementById(`${input.id}-error`);
    if (el) el.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const resetMessages = () => {
    fieldError(email, '');
    fieldError(password, '');
    formError.textContent = '';
    status.textContent = '';
  };

  const setBusy = (on) => {
    busy = on;
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    email.readOnly = on;
    password.readOnly = on;
    form.querySelectorAll('[data-close-modal]').forEach((btn) => (btn.disabled = on));
  };

  const validate = () => {
    const value = email.value.trim();
    let ok = true;
    if (!value) {
      fieldError(email, 'Enter your email address.');
      ok = false;
    } else if (email.validity.typeMismatch) {
      fieldError(email, 'Enter a valid email address, like name@company.com.');
      ok = false;
    }
    if (!password.value) {
      fieldError(password, 'Enter your password.');
      ok = false;
    }
    if (!ok) form.querySelector('[aria-invalid="true"]')?.focus();
    return ok;
  };

  const messageFor = (err) => {
    const code = err?.code || '';
    const text = String(err?.message || '');
    if (code === 'invalid_credentials' || /invalid login credentials/i.test(text)) {
      return 'Incorrect email or password. Please check your details and try again.';
    }
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(text)) {
      return 'This email address has not been confirmed yet. Use the confirmation link sent to your inbox, then try again.';
    }
    if (err?.status === 429 || /rate limit/i.test(text)) {
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    }
    if (err?.name === 'AuthRetryableFetchError' || err instanceof TypeError || /fetch|network/i.test(text)) {
      return 'We could not reach the sign-in service. Check your internet connection and try again.';
    }
    return text || 'Something went wrong while signing in. Please try again.';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    resetMessages();
    if (!validate()) return;

    const client = window.nexoraSupabase;
    if (!client) {
      formError.textContent = 'Sign-in is unavailable because the authentication service could not be loaded. Check your connection and refresh the page.';
      return;
    }

    setBusy(true);
    status.textContent = 'Signing you in…';
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
      if (error) throw error;
      if (!data?.session) throw new Error('Sign-in did not return a session. Please try again.');
      status.textContent = 'Signed in successfully. Redirecting to your dashboard…';
      setTimeout(() => location.assign(REDIRECT_TO), 700);
    } catch (err) {
      setBusy(false);
      status.textContent = '';
      formError.textContent = messageFor(err);
      password.value = '';
      password.focus();
    }
  });

  [email, password].forEach((input) =>
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') fieldError(input, '');
      formError.textContent = '';
    })
  );

  // An in-flight request would still redirect, so keep the dialog open until it settles.
  dialog?.addEventListener('cancel', (e) => {
    if (busy) e.preventDefault();
  });
  dialog?.addEventListener('nexora:open', () => {
    setBusy(false);
    resetMessages();
  });
})();
