import { Route, Switch } from "wouter";

const App = () => {
  return (
    <div className="app-container">
      <Switch>
        <Route path="/" exact>
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Welcome to VendorHive</h1>
          </div>
        </Route>
        <Route>
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </div>
  );
};

export default App;