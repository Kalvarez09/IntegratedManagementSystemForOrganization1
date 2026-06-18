// Extract token from URL: /reset-password?token=abc123
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            document.getElementById('form-section').style.display = 'none';
            document.getElementById('invalid-token').style.display = 'block';
        }

        function togglePw(id, el) {
            const input = document.getElementById(id);
            if (input.type === 'password') {
                input.type = 'text';
                el.textContent = 'hide';
            } else {
                input.type = 'password';
                el.textContent = 'show';
            }
        }

        async function submitForm() {
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm').value;
            const btn = document.getElementById('submit-btn');

            document.getElementById('password').classList.remove('invalid');
            document.getElementById('confirm').classList.remove('invalid');

            if (password.length < 8) {
                document.getElementById('password').classList.add('invalid');
                showMessage('Password must be at least 8 characters.', 'error');
                return;
            }

            if (password !== confirm) {
                document.getElementById('confirm').classList.add('invalid');
                showMessage('Passwords do not match.', 'error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Resetting…';

            try {
                const res = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, password })
                });

                const data = await res.json();

                if (res.ok) {
                    showMessage('Password reset! Redirecting to login…', 'success');
                    setTimeout(() => { window.location.href = './Login.html'; }, 2000);
                } else if (res.status === 400) {
                    document.getElementById('form-section').style.display = 'none';
                    document.getElementById('invalid-token').style.display = 'block';
                } else {
                    showMessage(data.error || 'Something went wrong.', 'error');
                }
            } catch (err) {
                showMessage('Could not connect. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Reset password';
            }
        }

        function showMessage(text, type) {
            const msg = document.getElementById('message');
            msg.textContent = text;
            msg.className = 'message ' + type;
            msg.style.display = 'block';
        }