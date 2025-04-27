import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Wildfire from './components/Wildfire/Wildfire';
import CurrentWF from './CurrentWF';
import FirePredictionPage from './FirePredictionPage';
import Kmeans from './Kmeans';
import FireMap from './components/fire-spread';

function App() {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={<Wildfire />} />
        <Route path="/current" element={<CurrentWF />} />
        <Route path='/pred' element={<FirePredictionPage/>}/>
        <Route path='/kmean' element={<Kmeans/>}/>
        <Route path="/fire-spread" element={<FireMap/>} />
      </Routes>
    </Router>
  );
}

export default App;
