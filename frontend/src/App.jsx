import { useState } from 'react'
import Signup from './components/common/Signup'
import Signin from './components/common/Signin'
import ForgotPassword from './components/common/ForgotPassword'
import Home from './components/common/Home'
import Workspace from './components/common/Workspace'
import './index.css'
import ResetPassword from './components/common/ResetPassword'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/editor/Editor'

function App() {

  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/workspace/:workspaceId" element={<Workspace />} />
        {/* <Route path="/editor" element={<Editor />} /> */}
        <Route path="/workspace/:workspaceId/document/:documentId" element={<Editor />} />
      </Routes>
    </Router>

      
    </>
  )
}

export default App
