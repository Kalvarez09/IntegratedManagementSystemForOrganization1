function getDocIcon(filename) {
      const ext = filename?.split('.').pop()?.toLowerCase();
      const icons = { pdf:'fa-file-pdf', docx:'fa-file-word', doc:'fa-file-word',
        xlsx:'fa-file-excel', xls:'fa-file-excel', png:'fa-file-image', jpg:'fa-file-image', jpeg:'fa-file-image' };
      return 'fas ' + (icons[ext] || 'fa-file');
    }

    function escHtml(str) {
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    async function downloadDoc(id, filename) {
      try {
        const res = await fetch(`/api/documents/download/${id}`);
        if (res.status === 403) { showStatus('You do not have permission to download this file.', 'error'); return; }
        if (!res.ok) { showStatus('File not found or has been removed.', 'error'); return; }
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      } catch { showStatus('Could not connect to server.', 'error'); }
    }

    function showStatus(msg, type) {
      const el = document.getElementById('statusBar');
      el.textContent = msg;
      el.className = 'status-bar ' + type;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    window.addEventListener('DOMContentLoaded', async () => {
      const tbody = document.getElementById('docTableBody');
      try {
        const res  = await fetch('/api/documents');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const docs = data.documents;

        if (docs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" class="doc-empty">No documents available yet.</td></tr>`;
          return;
        }

        tbody.innerHTML = docs.map(doc => `
          <tr>
            <td><div class="doc-cell">
              <div class="doc-icon"><i class="${getDocIcon(doc.filename)}"></i></div>
              <a href="DocumentView.html?id=${doc.id}" style="color:#f1f5f9; text-decoration:none;">${escHtml(doc.title || doc.filename)}</a>
            </div></td>
            <td><span class="cat-pill">${escHtml(doc.category || 'Uncategorized')}</span></td>
            <td>${new Date(doc.uploaded_at).toLocaleDateString()}</td>
            <td>
              <a href="DocumentView.html?id=${doc.id}" class="dl-btn">
                <i class="fas fa-eye"></i> View
              </a>
            </td>
          </tr>
        `).join('');
      } catch {
        tbody.innerHTML = `<tr><td colspan="4" class="doc-empty">Could not load files.</td></tr>`;
      }
    });