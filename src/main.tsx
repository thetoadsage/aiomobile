import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './themes.css';
import { loadSettings } from './lib/settings';
import { applyTheme } from './lib/themes';
applyTheme(loadSettings().theme);
ReactDOM.createRoot(document.getElementById('root')!).render(<App/>);
