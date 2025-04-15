import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Function to get window width with fallback for SSR
function getWindowWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 0
}

export function useIsMobile() {
  // Always default to true for mobile first approach
  const [isMobile, setIsMobile] = React.useState<boolean>(true)

  React.useEffect(() => {
    // Prevent running during SSR
    if (typeof window === 'undefined') return

    // Function to check if viewport is mobile-sized
    const checkMobile = () => {
      const windowWidth = getWindowWidth()
      const isMobileViewport = windowWidth < MOBILE_BREAKPOINT
      
      // Only update state if there's an actual change
      if (isMobile !== isMobileViewport) {
        console.log("[Mobile Detection] Window width:", windowWidth, "isMobile:", isMobileViewport)
        setIsMobile(isMobileViewport)
      }
    }

    // Check immediately on mount
    checkMobile()

    // Set up event listener with debouncing for window resizing
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkMobile, 100) // Debounce resize events
    }
    
    window.addEventListener("resize", handleResize)
    
    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimer)
    }
  }, [isMobile]) // Added isMobile as dependency for accurate checks

  return isMobile
}
