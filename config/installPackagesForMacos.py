import subprocess
import sys

def install(package):
    """Install a package using pip."""
    try:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"{package} installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while installing {package}: {e}")
        sys.exit(1)

def check_pip():
    """Ensure pip is installed and up-to-date."""
    try:
        import pip
    except ImportError:
        print("pip is not installed. Installing pip...")
        subprocess.check_call([sys.executable, "-m", "ensurepip", "--upgrade"])
        print("pip installed successfully.")
    else:
        print("pip is installed. Upgrading pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
        print("pip is up-to-date.")

def main():
    packages = [
        "streamlit",
        "requests",
        "langchain_openai",
        "langchain_google_genai",
        "langchain_anthropic",
        "langchain_nvidia_ai_endpoints",
        "langchain",
        "scikit-learn",
        "langchain_mistralai",
        "openpyxl",
        "matplotlib",
    ]
    
    for package in packages:
        try:
            # Import the package to check if it's already installed
            __import__(package.split()[0])
            print(f"{package} is already installed.")
        except ImportError:
            install(package)

if __name__ == "__main__":
    check_pip()
    main()
