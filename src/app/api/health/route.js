import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
  };

  try {
    // Check database connection
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    checks.checks.database = {
      status: error ? 'unhealthy' : 'healthy',
      message: error ? error.message : 'Connected',
      responseTime: Date.now(),
    };

    // Check if critical tables exist
    const tables = ['users', 'listings', 'transactions', 'messages'];
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (tableError) {
        checks.checks[`table_${table}`] = {
          status: 'unhealthy',
          message: tableError.message,
        };
        checks.status = 'degraded';
      }
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    checks.checks.environment = {
      status: missingVars.length === 0 ? 'healthy' : 'unhealthy',
      message:
        missingVars.length === 0
          ? 'All required variables set'
          : `Missing: ${missingVars.join(', ')}`,
    };

    if (missingVars.length > 0) {
      checks.status = 'unhealthy';
    }

    // Overall status
    const allHealthy = Object.values(checks.checks).every(
      (check) => check.status === 'healthy'
    );

    checks.status = allHealthy ? 'healthy' : checks.status;

    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}

