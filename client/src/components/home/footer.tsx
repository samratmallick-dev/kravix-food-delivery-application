import Logo from "../navbar/logo";

const Footer = () => {
      return (
            <footer className="bg-card border-t border-border">
                              <div className="container-app py-12">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                          <div>
                                                <Logo />
                                                <p className="text-sm text-gray-500">
                                                      Your favorite food, delivered fresh and fast. Taste the best of Bengali cuisine and beyond.
                                                </p>
                                          </div>
                                          <div>
                                                <h4 className="font-semibold mb-3 text-gray-700">Company</h4>
                                                <ul className="space-y-2 text-sm text-gray-500">
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">About Us</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Careers</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Blog</li>
                                                </ul>
                                          </div>
                                          <div>
                                                <h4 className="font-semibold mb-3 text-gray-700">Support</h4>
                                                <ul className="space-y-2 text-sm text-gray-500">
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Help Center</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Contact Us</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">FAQs</li>
                                                </ul>
                                          </div>
                                          <div>
                                                <h4 className="font-semibold mb-3 text-gray-700">Legal</h4>
                                                <ul className="space-y-2 text-sm text-gray-500">
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Privacy Policy</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Terms of Service</li>
                                                      <li className="hover:text-gray-600 cursor-pointer transition-colors">Refund Policy</li>
                                                </ul>
                                          </div>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-border text-center text-sm text-gray-500">
                                          © {new Date().getFullYear()} আবার খাবো. All rights reserved. Made By ❤️ Abar Kahbo Teams.
                                    </div>
                              </div>
                        </footer>
      );
}

export default Footer;
