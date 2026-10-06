import type { TasksSnapshot } from '../api/monitoringTypes';
import { TaskResults } from '../components/InstanceHealth';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';

export function BackgroundTasks({ settings, loginUrl }: { settings: Settings; loginUrl: string }) {
  const tasks = useData<TasksSnapshot>(settings.baseUrl, '/tasks', settings.historySeconds, true, false, 1);
  return <>
    <div className="intro"><h1>Background tasks</h1><p>Latest results and scheduled runs.</p></div>
    <TaskResults resource={tasks} loginUrl={loginUrl}/>
    <p className="caption">Read-only status. Opening this view does not run tasks.</p>
  </>;
}
