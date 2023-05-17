import os
import time
import paramiko

hostname = 'ilab3.cs.rutgers.edu'
port = 22
username = 'cs1346'
password = 'Steve202502'
remote_path = '/common/home/cs1346/webid/WIRED/Data/valur/wikipedia'

while True:
    time.sleep(7200)
    for filename in os.listdir('.'):
        if filename.endswith('.pcap'):
            local_path = os.path.join(os.getcwd(), filename)
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(hostname, port, username, password)
            print(remote_path)
            print(local_path)
            sftp = ssh.open_sftp()
            remote_file_path = os.path.join(remote_path, filename)
            sftp.put(local_path, remote_file_path)
            sftp.close()
            ssh.close()
            os.remove(local_path)
            print(filename)

    print("done one round")

    #time.sleep(7200)