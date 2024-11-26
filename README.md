# Setup and Run Instructions

Follow these steps to set up and run the application. Instructions for both Windows and macOS are included.

## 1.Create the Asset Database

Windows:
python .\config\setupdatabase.py

macOS:
python ./config/setupdatabase.py

## 2. Create the Working Environment

Windows:
python .\config\installpackages.py
macOS:
python ./config/installpackages.py

## 3. Delete Previously Installed Libraries (If Needed)
If you encounter issues and need to uninstall all previously installed libraries, use the following command.

Windows:
pip freeze | %{$_.split('==')[0]} | %{pip uninstall -y $_}
macOS:
pip freeze | awk -F'==' '{print $1}' | xargs pip uninstall -y

## 4. Run the Program

Windows:
streamlit run main.py
macOS:
streamlit run main.py






To get free API key for GoogleGenerativeAI models:
https://aistudio.google.com/prompts/new_chat

To get free API key for ChatNVIDIA models:
https://build.nvidia.com/ibm/granite-3_0-8b-instruct?snippet_tab=LangChain

To get free API key for ChatMistralAI models:
https://console.mistral.ai/api-keys/
