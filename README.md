To create the asset database:
python .\config\setupdatabase.py

To create the working environment:
python .\config\installpackages.py

To delete all previously installed libraries (in case of a problem):
pip freeze | %{$_.split('==')[0]} | %{pip uninstall -y $_}

To run the program:
streamlit run main.py

To get free API key for GoogleGenerativeAI models:
https://aistudio.google.com/prompts/new_chat

To get free API key for ChatNVIDIA models:
https://build.nvidia.com/ibm/granite-3_0-8b-instruct?snippet_tab=LangChain

To get free API key for ChatMistralAI models:
https://console.mistral.ai/api-keys/