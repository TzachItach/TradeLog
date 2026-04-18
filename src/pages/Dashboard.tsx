import { useStore } from '../store';
import { useT } from '../i18n';
import StatsBar from '../components/StatsBar';
import CalendarView from '../components/CalendarView';
import DailyGoalBar from '../components/DailyGoalBar';
import PropFirmCard from '../components/PropFirmCard';

export default function Dashboard() {
  const { lang } = useStore();
  const T = useT(lang);

  return (
    <div className="page-content">
      <PropFirmCard />
      <StatsBar />
      <DailyGoalBar />
      <CalendarView />
      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
