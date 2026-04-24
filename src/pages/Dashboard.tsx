import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import StatsBar from '../components/StatsBar';
import CalendarView from '../components/CalendarView';
import DailyGoalBar from '../components/DailyGoalBar';
import MiniEquityChart from '../components/MiniEquityChart';
import RecentTrades from '../components/RecentTrades';
import AIInsightsCard from '../components/AIInsightsCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { lang } = useStore();
  const T = useT(lang);

  return (
    <div className="page-content">
      <StatsBar />
      <DailyGoalBar />
      <CalendarView />

      <div className="dashboard-bottom-row">
        <div className="dashboard-equity-col">
          <div className="dashboard-section-header">
            <span className="dashboard-section-title">
              {lang === 'he' ? 'עקומת הון' : 'Equity Curve'}
            </span>
          </div>
          <div className="dashboard-chart-card">
            <MiniEquityChart />
          </div>
        </div>

        <div className="dashboard-trades-col">
          <div className="dashboard-section-header">
            <span className="dashboard-section-title">
              {lang === 'he' ? 'עסקאות אחרונות' : 'Recent Trades'}
            </span>
            <span
              className="dashboard-see-all"
              onClick={() => navigate('/trades')}
            >
              {lang === 'he' ? 'הכל' : 'See all'}
            </span>
          </div>
          <RecentTrades />
        </div>
      </div>

      <AIInsightsCard />

      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
