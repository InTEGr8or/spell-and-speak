
import os

def install_and_import(package):
    import importlib
    try:
        importlib.import_module(package)
    except ImportError:
        import pip
        os.system('python -m pip install ' + package)
    finally:
        globals()[package] = importlib.import_module(package)

# Attempt to import the audiocraft.models or install it if not present
try:
    from audiocraft.models import AudioGen
except ImportError:
    install_and_import('audiocraft')  # You might need to replace 'audiocraft' with the correct package name if different
    from audiocraft.models import AudioGen

# Proceed with the model loading and generation
model = AudioGen.get_pretrained("facebook/audiogen-medium")
model.set_generation_params(duration=3)  # generate 5 seconds.
descriptions = ['cute dog barking', 'cute cat meowing', 'cute bird chirping']
wav = model.generate(descriptions)  # generates 3 samples.