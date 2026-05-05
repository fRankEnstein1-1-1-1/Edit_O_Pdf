import {BrowserRouter,Route,Routes} from "react-router-dom"
import UploadPage from "../pages/UploadPage";
import TutorialPage from "../pages/TutorialPage";
import EditorPage from "../pages/EditorPage";
function App(){
return <>
<BrowserRouter>
<Routes>
  <Route path="/" element={<UploadPage/>}/>
  <Route path="/tutorial" element={<TutorialPage/>}/>
  <Route path = "/editor/:id" element={<EditorPage/>}/>
</Routes>
</BrowserRouter>
</>
}
export default App;