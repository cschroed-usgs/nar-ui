'''
Created on Dec 11, 2016

@author: cschroed
'''
import requests
import nar_common.settings as settings

'''
Some tiers (dev, localhost) require access to a custom CA bundle so that they can trust self-signed certificates
This function adds the custom CA bundle if one is requested in local_settings  
'''
def safe_session():
    session = requests.Session()
    if hasattr(settings, 'CUSTOM_CA_BUNDLE') and 0 != len(settings.CUSTOM_CA_BUNDLE):
        session.verify = settings.CUSTOM_CA_BUNDLE
    return session