"""
Django settings for nar_common project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

PROJECT_HOME = os.path.dirname(__file__)
SITE_HOME = PROJECT_HOME.rsplit(os.sep, 1)[0]


# Application definition

INSTALLED_APPS = (
#    'django.contrib.admin',
#    'django.contrib.auth',
    'django.contrib.contenttypes',
#    'django.contrib.sessions',
#    'django.contrib.messages',
    'django.contrib.staticfiles',
    'compressor',
    'nar_ui',
    'utils',
    'helpcontent',
    'nar_values',
    
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'nar_common.urls'

# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = os.path.join(SITE_HOME, 'static')

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'


STATICFILES_DIRS = (
    os.path.join(PROJECT_HOME, "static"),
)

TEMPLATE_DIRS = (
    os.path.join (PROJECT_HOME, 'templates'),
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Don't forget to use absolute paths, not relative paths.
)

#less css
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    # other finders..
    'compressor.finders.CompressorFinder',
)

COMPRESS_PRECOMPILERS = (
      ('text/less', 'lessc {infile} {outfile}'),
)

#We need to set this. See bug: https://github.com/django-compressor/django-compressor/issues/261
COMPRESS_PARSER = 'compressor.parser.HtmlParser' 

INTERNAL_IPS = ('127.0.0.1',)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
    "django.core.context_processors.request",
    "nar_common.settings_context_processor.default"                       
)
# Set to the most current water year in the loaded data
NAR_CURRENT_WATER_YEAR = 2014

#This is injected unescaped into a single-quoted javascript string
#This is done to fool the qa response rewrites that do a simple cida.usgs.gov -> cida-test.er.usgs.gov replacement
NAR_SOS_DEFS_BASE_URL = "https://cida.'+ /* concatenating like this prevents this from being rewritten to a qa url by the apache frontend */ 'usgs.gov/def/NAR/"

TEST_RUNNER = 'nar_common.test_runner.ManagedModelTestRunner' 

try:
    from local_settings import *
except ImportError:
    pass 

if os.getenv('JENKINS_URL', False):
    
    JENKINS_TEST_RUNNER = 'nar_common.test_jenkins_runner.ManagedModelTestRunner'
    
    INSTALLED_APPS += ('django_jenkins',)
    
    JENKINS_TASKS = (
        'django_jenkins.tasks.run_pylint',
    )
    PYLINT_RCFILE = (
        '--ignore=utils/tests' # Tests are not processed through pylint
    )
    PROJECT_APPS = ('utils', 'helpcontent') #Specify which apps you want to test
