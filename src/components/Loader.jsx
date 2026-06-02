import React from 'react';

/**
 * Loading indicator component with styling matching FitStyle branding
 * @param {string} message - Primary status message
 * @param {string} submessage - Extra descriptive subtitle
 * @param {boolean} overlay - Whether to render as fullscreen backdrop overlay
 */
const Loader = ({ message = 'Loading...', submessage, overlay = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {/* Spinning Ring */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-gold border-r-gold animate-spin"></div>
      </div>
      
      <div className="space-y-1">
        <p className="text-white font-outfit font-semibold text-lg tracking-wide">
          {message}
        </p>
        {submessage && (
          <p className="text-dark-muted font-inter text-xs max-w-xs mx-auto">
            {submessage}
          </p>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in">
        <div className="glass-panel-gold max-w-sm w-full mx-4 rounded-2xl p-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl w-full flex items-center justify-center min-h-[250px]">
      {content}
    </div>
  );
};

export default Loader;
