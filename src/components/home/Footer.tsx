export default function Footer() {
    return (
      <footer className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              Sophia<span className="text-blue-600">.</span>
            </span>
            <p className="text-gray-600">&copy; 2025 All rights reserved.</p>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    )
  }