import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(true) // Default to true to ensure mobile UI is shown initially

  React.useEffect(() => {
    // Function to check if viewport is mobile-sized
    const checkMobile = () => {
      const isMobileViewport = window.innerWidth < MOBILE_BREAKPOINT
      console.log("[Mobile Detection] Window width:", window.innerWidth, "isMobile:", isMobileViewport)
      setIsMobile(isMobileViewport)
    }

    // Check immediately on mount
    checkMobile()

    // Set up event listener for window resizing
    window.addEventListener("resize", checkMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // For debugging - log when the value changes
  React.useEffect(() => {
    console.log("[Mobile Detection] isMobile state is now:", isMobile)
  }, [isMobile])

  return isMobile
}
