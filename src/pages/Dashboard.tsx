import { useStore } from '../store';
import { useT } from '../i18n';
import StatsBar from '../components/StatsBar';
import CalendarView from '../components/CalendarView';

export default function Dashboard() {
  const { lang } = useStore();
  const T = useT(lang);

  return (
    <div className="page-content">
      <StatsBar />
      <CalendarView />
      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
