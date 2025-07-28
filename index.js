const runsEl = document.getElementById('runs');
async function loadRuns(){
  const res = await fetch('/api/runs');
  if(!res.ok) return;
  const data = await res.json();
  runsEl.innerHTML = '<h2>Recent Runs</h2>';
  if(!data.runs.length){ runsEl.innerHTML += '<p>No runs yet.</p>'; return; }
  const ul = document.createElement('ul');
  data.runs.forEach((r)=>{
    const li = document.createElement('li');
    li.textContent = `${r.runId} - ${r.status}`;
    ul.appendChild(li);
  });
  runsEl.appendChild(ul);
}
loadRuns();
setInterval(loadRuns, 5000);
