import Logo from "../navbar/logo";

const Footer = () => {
      return (
            <footer className="bg-card border-t border-border">
                  <div className="container-app py-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                              <div className="flex flex-col gap-3">
                                    <Logo />
                                    <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
                                          Your favorite food, delivered fresh and fast. Taste the best of Bengali cuisine and beyond.
                                    </p>
                              </div>
                              <div>
                                    <h4 className="font-bold mb-4 text-gray-800 text-sm tracking-wider uppercase">Company</h4>
                                    <ul className="space-y-2.5 text-sm text-gray-500">
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">About Us</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Careers</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Blog</li>
                                    </ul>
                              </div>
                              <div>
                                    <h4 className="font-bold mb-4 text-gray-800 text-sm tracking-wider uppercase">Support</h4>
                                    <ul className="space-y-2.5 text-sm text-gray-500">
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Help Center</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Contact Us</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">FAQs</li>
                                    </ul>
                              </div>
                              <div>
                                    <h4 className="font-bold mb-4 text-gray-800 text-sm tracking-wider uppercase">Legal</h4>
                                    <ul className="space-y-2.5 text-sm text-gray-500">
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Privacy Policy</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Terms of Service</li>
                                          <li className="hover:text-primary cursor-pointer transition-colors duration-200">Refund Policy</li>
                                    </ul>
                              </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-sm text-gray-500">
                              <p>© {new Date().getFullYear()} Kravix - Be Smart, Eat Better. All rights reserved.</p>
                              <p className="flex items-center gap-1.5 justify-center">
                                    Made with <span className="text-primary animate-pulse">❤️</span> by Kravix Team
                              </p>
                        </div>
                  </div>
            </footer>
      );
}

export default Footer;
