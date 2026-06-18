async function submitForm() {
                const email = document.getElementById('email').value.trim();
                const btn = document.getElementById('submit-btn');
                const msg = document.getElementById('message');

                msg.style.display = 'none';

                if (!email) {
                    showMessage('Please enter your email address.', 'error');
                    return;
                }

                btn.disabled = true;
                btn.textContent = 'Sending…';

                try {
                    const res = await fetch('/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    // Always show success to avoid revealing if email exists
                    showMessage('If that email is registered, you\'ll receive a reset link shortly.', 'success');
                    document.getElementById('email').value = '';
                } catch (err) {
                    showMessage('Something went wrong. Please try again.', 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Send reset link';
                }
            }

            function showMessage(text, type) {
                const msg = document.getElementById('message');
                msg.textContent = text;
                msg.className = 'message ' + type;
                msg.style.display = 'block';
            }

            document.getElementById('email').addEventListener('keydown', function (e) {
                if (e.key === 'Enter') submitForm();
            });