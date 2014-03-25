from django.conf import settings

def default(request):

    # you can declare any variable that you would like and pass 
    # them as a dictionary to be added to each template's context like so:
    exposedSettingNames = ['BASE_URL']
    exposedSettings = {}
    for exposedSettingName in exposedSettingNames:
        if hasattr(settings, exposedSettingName):
            exposedSettings[exposedSettingName] = getattr(settings, exposedSettingName)
            
    return dict(
        settings = exposedSettings
    )