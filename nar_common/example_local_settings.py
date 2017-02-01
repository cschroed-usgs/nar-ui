import os
from sys import argv
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# This checks to see if django tests are running (i.e. manage.py test)
if argv and 1 < len(argv):  
    RUNNING_TESTS = 'test' in argv
else:  
    RUNNING_TESTS= False  

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'ChangeMe'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

#Fill in the HOST and password for the desired database
if not RUNNING_TESTS:
    DATABASES = {
        'default' : {
            'ENGINE' : 'django.db.backends.postgresql_psycopg2',
            'NAME' : 'postgres',
            'USER' : 'postgres',
            'PASSWORD' : '',
            'HOST' : '152.61.236.193',
            'PORT' : '5432'
        }
    }


ALLOWED_HOSTS = ['localhost', '127.0.0.1']

STATIC_URL =  '/static/'

SOS_HOST_NAME = 'cida-eros-nardev.er.usgs.gov'

#no trailing slash

SOS_PATH = ':8443/quality/rivers/service/sos/sos'

GEOSERVER_HOST_NAME = 'cida-eros-nardev.er.usgs.gov'

GEOSERVER_PATH = ':8445/quality/rivers/service/geoserver/'

NAR_WEBSERVICE = 'cida-eros-nardev.er.usgs.gov'

NAR_WEBSERVICE_PATH = ':8446/quality/rivers/webservices/service/'

#this only needs to be defined on localhost, dev
this_directory = os.path.dirname(os.path.realpath(__file__))
nardev_cert_path = os.path.join(this_directory, 'resources', 'cida-eros-nardev.er.usgs.gov.pem')
CUSTOM_CA_BUNDLE = nardev_cert_path
