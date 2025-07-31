// React Admin 主應用程式
import React, { useEffect } from 'react';
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import EventList from './components/EventList';
import EventEdit from './components/EventEdit';
import EventCreate from './components/EventCreate';
import GroupList from './components/GroupList';
import GroupEdit from './components/GroupEdit';
import GroupCreate from './components/GroupCreate';

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
        show={ShowGuesser} 
      />
      <Resource 
        name="groups" 
        list={GroupList} 
        edit={GroupEdit} 
        create={GroupCreate}
        show={ShowGuesser} 
      />
    </Admin>
  );
};

export default App;