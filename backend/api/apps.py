from django.apps import AppConfig
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
import json
import os

# #region agent log
LOG_PATH = '/Users/suzukiakiramuki/playground/rakutanchecker/.cursor/debug.log'
def _log_debug(location, message, data, hypothesis_id=None):
    try:
        with open(LOG_PATH, 'a') as f:
            log_entry = {
                'sessionId': 'debug-session',
                'runId': 'run1',
                'hypothesisId': hypothesis_id,
                'location': location,
                'message': message,
                'data': data,
                'timestamp': int(__import__('time').time() * 1000)
            }
            f.write(json.dumps(log_entry) + '\n')
    except Exception:
        pass
# #endregion


class ApiConfig(AppConfig):
    name = 'api'
    
    def ready(self):
        # #region agent log
        _log_debug('apps.py:ApiConfig.ready', 'アプリケーション起動開始', {}, 'H3')
        # #endregion
        
        # #region agent log
        try:
            db_path = connection.settings_dict.get('NAME', 'unknown')
            _log_debug('apps.py:ApiConfig.ready', 'データベースパス確認', {'db_path': str(db_path), 'exists': os.path.exists(str(db_path)) if db_path != 'unknown' else False}, 'H3')
        except Exception as e:
            _log_debug('apps.py:ApiConfig.ready', 'データベースパス確認エラー', {'error': str(e)}, 'H3')
        # #endregion
        
        # #region agent log
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='api_course'")
                table_exists = cursor.fetchone() is not None
                if table_exists:
                    cursor.execute("PRAGMA table_info(api_course)")
                    columns = [row[1] for row in cursor.fetchall()]
                else:
                    columns = []
            _log_debug('apps.py:ApiConfig.ready', 'api_courseテーブル確認', {'table_exists': table_exists, 'columns': columns, 'has_target_enrollment_year': 'target_enrollment_year' in columns}, 'H3')
        except Exception as e:
            _log_debug('apps.py:ApiConfig.ready', 'api_courseテーブル確認エラー', {'error': str(e)}, 'H3')
        # #endregion
        
        # #region agent log
        try:
            executor = MigrationExecutor(connection)
            applied = [m.name for m in executor.loader.applied_migrations]
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            _log_debug('apps.py:ApiConfig.ready', 'マイグレーション状態確認', {
                'applied': applied,
                'pending_count': len(plan),
                'pending': [str(m[0]) for m in plan],
                'has_0008': '0008_course_enrollment_and_target_year' in applied
            }, 'H3')
        except Exception as e:
            _log_debug('apps.py:ApiConfig.ready', 'マイグレーション状態確認エラー', {'error': str(e)}, 'H3')
        # #endregion
        
        # #region agent log
        _log_debug('apps.py:ApiConfig.ready', 'アプリケーション起動完了', {}, 'H3')
        # #endregion