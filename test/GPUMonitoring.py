import subprocess
import time
from datetime import datetime

def get_gpu_memory_usage():
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=memory.used', '--format=csv,noheader,nounits'], stdout=subprocess.PIPE)
        output = result.stdout.decode('utf-8').strip()

        memory_used_mib = int(output.split()[5])  # first GPU is in use
        memory_used_gb = memory_used_mib / 1024  # MiB to GB
        
        return memory_used_gb

    except Exception as e:
        print(f"Error retrieving GPU memory usage: {e}")
        return None

if __name__ == "__main__":
    last_gpu_memory_usage = None
    with open('gpu_memory_usage_log.txt', 'a') as log_file:  
        try:
            while True:
                gpu_memory_usage = get_gpu_memory_usage()
                if gpu_memory_usage is not None and gpu_memory_usage != last_gpu_memory_usage:
                    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  
                    log_entry = f"{current_time} - GPU Memory Usage: {gpu_memory_usage:.2f} GB\n"
                    log_file.write(log_entry)
                    log_file.flush() 
                    last_gpu_memory_usage = gpu_memory_usage 
                time.sleep(1)

        except KeyboardInterrupt:
            print("\nMonitoring stopped by user.")
