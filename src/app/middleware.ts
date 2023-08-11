import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = [
    "https://www.my-frontend.com"
  ];
  export function middleware(request: NextRequest) {
    
    const requestHeaders = new Headers(request.headers);
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  
    const origin = requestHeaders.get('origin');
    if ( origin && allowedOrigins.includes(origin) ) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', "true")
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    }
  
    return response
  }