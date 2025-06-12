import Link from 'next/link';
import { Upload, Download, Shield, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">P2PShare</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure File Sharing
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Share files directly between browsers with end-to-end encryption. 
            No uploads to servers, no registration required.
          </p>

          {/* Main CTAs */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <Link 
              href="/upload"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
            >
              <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Send a File</h3>
              <p className="text-gray-600">
                Upload and encrypt your file, then share the secure link
              </p>
            </Link>

            <Link 
              href="/download"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
            >
              <Download className="h-12 w-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive a File</h3>
              <p className="text-gray-600">
                Enter a share link to download and decrypt your file
              </p>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
            <p className="text-gray-600">
              Files are encrypted with AES-256 in your browser before transfer
            </p>
          </div>

          <div className="text-center">
            <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Peer-to-Peer</h3>
            <p className="text-gray-600">
              Direct transfer between browsers using WebRTC technology
            </p>
          </div>

          <div className="text-center">
            <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Registration</h3>
            <p className="text-gray-600">
              Start sharing immediately without creating an account
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How it Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Upload & Encrypt</h4>
              <p className="text-sm text-gray-600">Select your file and it&apos;s encrypted locally</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Link</h4>
              <p className="text-sm text-gray-600">Copy and share the secure URL</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">P2P Transfer</h4>
              <p className="text-sm text-gray-600">Direct connection established</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Download</h4>
              <p className="text-sm text-gray-600">File is decrypted and downloaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>Built with Next.js, WebRTC, and AES-256 encryption</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
