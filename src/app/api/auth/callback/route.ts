import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle error from OAuth provider
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    // Exchange code for access token with WorkOS
    const clientId = process.env.WORKOS_CLIENT_ID;
    const clientSecret = process.env.WORKOS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Demo mode - redirect with mock user data
      const mockUser = encodeURIComponent(JSON.stringify({
        id: 'demo-user-001',
        email: 'vardaan.aggarwal@example.com',
        firstName: 'Vardaan',
        lastName: 'Aggarwal',
        organizationId: 'koenig-solutions',
      }));

      return NextResponse.redirect(
        new URL(`/?auth_user=${mockUser}`, request.url)
      );
    }

    // Real WorkOS integration
    const tokenResponse = await fetch('https://api.workos.com/sso/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Get user profile from WorkOS
    const profileResponse = await fetch('https://api.workos.com/sso/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(new URL('/login?error=profile_failed', request.url));
    }

    const profile = await profileResponse.json();

    // Create user object
    const user = {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name || profile.email.split('@')[0],
      lastName: profile.last_name || '',
      profilePictureUrl: profile.profile_picture_url,
      organizationId: profile.organization_id,
    };

    const encodedUser = encodeURIComponent(JSON.stringify(user));

    return NextResponse.redirect(
      new URL(`/?auth_user=${encodedUser}`, request.url)
    );
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
