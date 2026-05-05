import React, { useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import firstimage from "../src/assets/first.png"
import secondimage from "../src/assets/second.png"
import thirdimage from "../src/assets/three.png"
import fourthimage from "../src/assets/fourth.png"
import fifthimage from "../src/assets/fifth.png"
import './TutorialPage.css'; // We'll create this CSS file

const TutorialPage = () => {
    const navigate = useNavigate();
     const location = useLocation();
const [selectedImage, setSelectedImage] = useState(null);
  const documentId = location.state?.documentId;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Adjust based on your needs
  
  const handleBack = () => {
  navigate("/");
};
const handleComplete = () => {
  if (!documentId) {
    navigate("/");
    return;
  }

  navigate(`/editor/${documentId}`);
};

  const tutorialSteps = [
  {
    id: 1,
    title: "Getting Started",
    description: "Upload your PDF in seconds",
    image: firstimage,
    content:
      "To begin, upload your PDF file by clicking the 'Upload PDF' button or simply dragging and dropping your file into the upload area. The platform supports files up to 50MB. Once uploaded, your document will open in the editor automatically."
  },
  {
    id: 2,
    title: "Edit Your Document",
    description: "Modify text and content easily",
    image: secondimage,
    content:
      "Use the editing tools to modify your document. You can add new text, remove unwanted content, or replace existing sections. To replace content, use the eraser tool to carefully cover the original area, then add your new text on top. Adjust size and alignment for a clean result."
  },
  {
    id: 3,
    title: "Add Signatures & Drawings",
    description: "Sign or annotate your PDF",
    image: thirdimage,
    content:
      "Select the drawing tool to create signatures or freehand annotations. Simply draw directly on the document wherever needed. If you make a mistake, use the delete tool to remove and redraw your content."
  },
  {
    id: 4,
    title: "Insert Images",
    description: "Place images anywhere in your PDF",
    image: fourthimage,
    content:
      "Click on the image tool to upload pictures from your device. Once added, you can drag, resize, and position the image anywhere on the document to fit your needs."
  },
  {
    id: 5,
    title: "Save & Export",
    description: "Download your final document",
    image: fifthimage,
    content:
      "After completing your edits, click the save button to store your changes. You can then export and download the updated PDF. Make sure to save before exiting to avoid losing your work."
  }
];
const step = tutorialSteps[currentStep - 1];
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="tutorial-container">
      {/* Header */}
      <div className="tutorial-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon"></span>
            <h1>Edit_O_PDF Tutorial</h1>
          </div>
          <p className="header-subtitle">Tutorial to use editopdf</p>
        </div>
        <button className="back-button" onClick={handleBack}>
          ← Back to App
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-container">
          <div className="progress-steps">
            {tutorialSteps.map((step) => (
              <div
                key={step.id}
                className={`progress-step ${currentStep >= step.id ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="step-number">{step.id}</div>
                <div className="step-line"></div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tutorial-content">
        {/* Step Navigation Sidebar */}
        <div className="tutorial-sidebar">
          <h3 className="sidebar-title">Steps</h3>
          <nav className="step-nav">
            {tutorialSteps.map((step) => (
              <button
                key={step.id}
                className={`step-nav-item ${currentStep === step.id ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <span className="step-nav-number">{step.id}</span>
                <div className="step-nav-content">
                  <span className="step-nav-title">{step.title}</span>
                  <span className="step-nav-desc">{step.description}</span>
                </div>
                {currentStep === step.id && <span className="active-indicator">▸</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Tutorial Area */}
        <div className="tutorial-main">
          <div className="step-content">
            <div className="step-header">
              <span className="step-badge">Step {currentStep}</span>
              <h2 className="step-title">{tutorialSteps[currentStep - 1].title}</h2>
              <p className="step-description">{tutorialSteps[currentStep - 1].description}</p>
            </div>

            
   {/* Image Section */}
<div
  className="step-image-container"
  onClick={() => setSelectedImage(tutorialSteps[currentStep - 1].image)}
>
  <img
    src={tutorialSteps[currentStep - 1].image}
    alt={`Step ${currentStep}`}
    className="step-image"
  />

  <div className="image-overlay">
    <span className="click-hint">Click to enlarge</span>
  </div>
</div>
{selectedImage && (
  <div className="image-modal" onClick={() => setSelectedImage(null)}>
    <img
      src={selectedImage}
      alt="enlarged"
      className="modal-image"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}

            {/* Explanation Section */}
            <div className="step-explanation">
              <div className="explanation-header">
                <h3>Explanation</h3>
              </div>
              <p className="explanation-text">{tutorialSteps[currentStep - 1].content}</p>
            </div>

            {/* Tips Section */}

          </div>

          {/* Navigation Buttons */}
          <div className="step-navigation">
            <button
              className="nav-button prev"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              ← Previous Step
            </button>
            
            <div className="step-counter">
              {currentStep} / {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button className="nav-button next" onClick={nextStep}>
                Next Step →
              </button>
            ) : (
              <button className="nav-button complete" onClick={handleComplete}>
                Complete Tutorial 
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;