import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TradeModal from './TradeModal';
import { useStore } from '../store';

export default function Layout() {
  const { modal } = useStore();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
      </div>
      {modal && <TradeModal />}
    </div>
  );
}
