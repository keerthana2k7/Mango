import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { CamerasPage } from './pages/CamerasPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ImageGalleryPage } from './pages/ImageGalleryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LoginPage } from './pages/LoginPage';
import { TreeDetailModal } from './components/farm/TreeDetailModal';
import { api } from './services/api';
import { User, Farm, Tree, Camera, SimulationStatus, FarmAnalyticsSummary, PredictionRecord, ImageRecord } from './types';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!api.getToken());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Farm Data
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);
  const [farmLayout, setFarmLayout] = useState<import('./types').FarmLayout | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);
  const [analytics, setAnalytics] = useState<FarmAnalyticsSummary | null>(null);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [images, setImages] = useState<ImageRecord[]>([]);

  // Selected Tree for modal
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);

  // Initialize or check auth
  useEffect(() => {
    if (isAuthenticated) {
      api.getCurrentUser()
        .then(setUser)
        .catch(() => {
          setIsAuthenticated(false);
          api.setToken(null);
        });
    }
  }, [isAuthenticated]);

  // Load Farm Data
  const loadFarmData = async (farmId: number) => {
    try {
      const [farmList, layoutRes, treeList, camList, analyticsRes, predList, imgList] = await Promise.all([
        api.getFarms(),
        api.getFarmLayout(farmId).catch(() => null),
        api.getFarmTrees(farmId).catch(() => []),
        api.getFarmCameras(farmId).catch(() => []),
        api.getAnalytics(farmId).catch(() => null),
        api.getFarmPredictions(farmId).catch(() => []),
        api.getFarmImages(farmId).catch(() => []),
      ]);

      setFarms(farmList);
      setFarmLayout(layoutRes);
      setTrees(treeList);
      setCameras(camList);
      setAnalytics(analyticsRes);
      setPredictions(predList);
      setImages(imgList);


      if (camList.length > 0) {
        const simRes = await api.getSimulationStatus(camList[0].id).catch(() => null);
        setSimulationStatus(simRes);
      }
    } catch (err) {
      console.error('Failed to load farm data', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFarmData(selectedFarmId);
    }
  }, [isAuthenticated, selectedFarmId]);

  // Polling simulation status every 1.5 seconds if running
  useEffect(() => {
    if (!isAuthenticated || cameras.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const status = await api.getSimulationStatus(cameras[0].id);
        setSimulationStatus(status);
        // If simulation is stepping or active, periodically refresh trees & analytics
        if (status.status === 'MOVING' || status.status === 'CAPTURING') {
          const [updatedTrees, updatedAnalytics, updatedPreds] = await Promise.all([
            api.getFarmTrees(selectedFarmId).catch(() => trees),
            api.getAnalytics(selectedFarmId).catch(() => analytics),
            api.getFarmPredictions(selectedFarmId).catch(() => predictions),
          ]);
          setTrees(updatedTrees);
          setAnalytics(updatedAnalytics);
          setPredictions(updatedPreds);
        }
      } catch (err) {
        // silent polling catch
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAuthenticated, cameras, selectedFarmId]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  // Simulation Controls
  const handleStartSim = async (speed: number) => {
    if (cameras.length === 0) return;
    const res = await api.startSimulation(cameras[0].id, speed);
    setSimulationStatus(res);
  };

  const handlePauseSim = async () => {
    if (cameras.length === 0) return;
    const res = await api.pauseSimulation(cameras[0].id);
    setSimulationStatus(res);
  };

  const handleStopSim = async () => {
    if (cameras.length === 0) return;
    const res = await api.stopSimulation(cameras[0].id);
    setSimulationStatus(res);
  };

  const handleResetSim = async () => {
    if (cameras.length === 0) return;
    const res = await api.resetSimulation(cameras[0].id);
    setSimulationStatus(res);
    loadFarmData(selectedFarmId);
  };

  const handleStepSim = async () => {
    if (cameras.length === 0) return;
    const res = await api.stepSimulation(cameras[0].id);
    setSimulationStatus(res);
    loadFarmData(selectedFarmId);
  };

  const handleSelectTreeNumber = (treeNumber: string) => {
    const target = trees.find((t) => t.tree_number === treeNumber);
    if (target) setSelectedTree(target);
  };

  const handleUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('farm_id', selectedFarmId.toString());
    formData.append('tree_id', (trees[0]?.id || 1).toString());
    formData.append('file', file);
    await api.uploadLeafImage(formData);
    loadFarmData(selectedFarmId);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const activeFarm = farms.find((f) => f.id === selectedFarmId) || farms[0] || null;
  const isSimulating = simulationStatus?.status === 'MOVING' || simulationStatus?.status === 'CAPTURING';

  return (
    <div className="flex min-h-screen bg-[#F4F7F5]">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          user={user}
          farms={farms}
          selectedFarmId={selectedFarmId}
          onSelectFarm={setSelectedFarmId}
          isSimulating={isSimulating}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              farm={activeFarm}
              layout={farmLayout}
              trees={trees}
              simulationStatus={simulationStatus}
              analytics={analytics}
              onStartSimulation={handleStartSim}
              onPauseSimulation={handlePauseSim}
              onStopSimulation={handleStopSim}
              onResetSimulation={handleResetSim}
              onStepSimulation={handleStepSim}
              onSelectTree={setSelectedTree}
              onSelectTreeNumber={handleSelectTreeNumber}
              onNavigateTab={setCurrentTab}
              speed={simSpeed}
              onSpeedChange={setSimSpeed}
            />
          )}

          {currentTab === 'farms' && (
            <FarmsPage farms={farms} trees={trees} onSelectTree={setSelectedTree} />
          )}

          {currentTab === 'cameras' && <CamerasPage cameras={cameras} />}

          {currentTab === 'simulation' && (
            <DashboardPage
              farm={activeFarm}
              layout={farmLayout}
              trees={trees}
              simulationStatus={simulationStatus}
              analytics={analytics}
              onStartSimulation={handleStartSim}
              onPauseSimulation={handlePauseSim}
              onStopSimulation={handleStopSim}
              onResetSimulation={handleResetSim}
              onStepSimulation={handleStepSim}
              onSelectTree={setSelectedTree}
              onSelectTreeNumber={handleSelectTreeNumber}
              onNavigateTab={setCurrentTab}
              speed={simSpeed}
              onSpeedChange={setSimSpeed}
            />
          )}


          {currentTab === 'predictions' && (
            <PredictionsPage predictions={predictions} onSelectTreeNumber={handleSelectTreeNumber} />
          )}

          {currentTab === 'images' && (
            <ImageGalleryPage images={images} onUploadImage={handleUploadImage} />
          )}

          {currentTab === 'analytics' && <AnalyticsPage analytics={analytics} />}
        </main>
      </div>

      {/* Tree Detail Inspector Modal */}
      <TreeDetailModal tree={selectedTree} onClose={() => setSelectedTree(null)} />
    </div>
  );
};
