// React Admin 主應用程式 - Updated to include System Maintenance Monitor
// Following Kent Beck's TDD principles (Red → Green → Refactor)

import React, { useEffect } from 'react';
import { Admin, Resource, ListGuesser, EditGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import EventList from './components/EventList';
import EventEdit from './components/EventEdit';
import EventCreate from './components/EventCreate';
import EventShow from './components/EventShow';
import GroupList from './components/GroupList';
import GroupEdit from './components/GroupEdit';
import GroupCreate from './components/GroupCreate';
import SystemMaintenanceMonitor from './components/SystemMaintenanceMonitor';

// Custom list component that renders SystemMaintenanceMonitor
const SystemDashboard = () => <SystemMaintenanceMonitor />;

const App = () => {
  useEffect(() => {
    document.title = 'Folklore Admin Dashboard';
  }, []);

  return (
    <Admin dataProvider={dataProvider} title="Folklore Admin Dashboard">
      <Resource 
        name="events" 
        list={EventList}
        edit={EventEdit}
        create={EventCreate}
        show={EventShow}
      />
      <Resource 
        name="groups" 
        list={GroupList} 
        edit={GroupEdit} 
        create={GroupCreate}
        show={ShowGuesser} 
      />
      <Resource 
        name="system" 
        list={SystemDashboard}
        options={{ label: '系統維護' }}
      />
    </Admin>
  );
};

export default App;