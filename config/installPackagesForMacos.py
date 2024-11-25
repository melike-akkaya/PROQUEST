import subprocess
import sys

def install(package):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while installing {package}: {e}")
        sys.exit(1)

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
        "matplotlib"
    ]
    
    for package in packages:
        try:
            __import__(package.split()[0])
            print(f"{package} is already installed.")
        except ImportError:
            print(f"Installing {package}...")
            install(package)
            print(f"{package} installed successfully.")

if __name__ == "_main_":
    try:
        import pip
    except ImportError:
        print("pip is not installed. Installing pip...")
        subprocess.check_call([sys.executable, "-m", "ensurepip", "--upgrade"])
        print("pip installed successfully.")

    main()