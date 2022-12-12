#!/usr/bin/python3

# short program to covert a pcap packet trace file into a
# a feature vector for ML based transmitter identification.
# Takes a small set of matching rules (UDP/TCP, IP/Port) and converts
# to a feature vector of [time-between-packets (microsec),size] array
# for the packet stream.

# (c) 2021 R. P. Martin, released under the GPL version 2 licence 

import argparse
import time
import os 
import dpkt
import struct 
import sys


# a set of rules to match the packets 
class MatchRules:
    def __init__(self, doTCP,doUDP, destIP,destPort, srcIP,srcPort):
        self.doTCP = doTCP
        self.doUDP = doUDP 
        self.destIP = destIP
        self.destPort = int(destPort)
        self.srcIP = srcIP
        self.srcPort =  int(srcPort)

    def tostr(self):
       return str(self.doTCP) + ":" + str(self.doUDP) + ":" + str(self.destIP) + ":" + str(self.destPort) + ":" + str(self.srcIP) + ":" + str(self.srcPort)

# check if a input packet matches the rules in this object
# if so, return true, else return false 
    def isMatch(self,packet):
        # check the IP source and destination 
        if (self.destIP != -1):
            if (self.destIP == str(packet.dst)):
                return True
            else:
                return False

        #check the TCP rules 
        if self.doTCP and (packet.p==dpkt.ip.IP_PROTO_TCP):
            if (self.destPort != -1):
                if (str(packet.p.ip.tcp.dport) == self.destPort):
                    return True
                else:
                    return False
        # check for UDP rules             
        if self.doUDP and (packet.p==dpkt.ip.IP_PROTO_UDP):
            if (self.destPort != -1):
                if ( packet.udp.dport == self.destPort):
                    return True
                else:
                    return False

        # no rules failed
        return True
def printHelp(): 
    print("convert a pcap file trace to a timing file")
    print("the timing file is a sequence of pairs of 32 bit integers.")
    print("The first being the time in nanoseconds since the arrival of the")
    print("previous packet, and the second is the size of the packet.")
    print("These pairs are the feature set used for the Transmitter Identification NNs ")
    print("")
    print("The packets can be filtered by matching the Protocol (UDP/TCP), source IP, source port")
    print("destination IP, destination port. The flags for the matches are: -udp, -tcp, -sip -dp -dip -dp ")
    print("E.g. to match all TCPs packet going to 192.168.2.1, port 80 use: -tcp -dip 192.168.2.1 -dp 80 ")
    print("Matches are positive only, that is, there is no black-listing ")
    print("")
    print("(C) 2021 R. P. Martin. Released under the GNU Public License, Version 3")
    
def inet_to_str(inet):
    # First try ipv4 and then ipv6
    try:
        return socket.inet_ntop(socket.AF_INET, inet)
    except ValueError:
        return socket.inet_ntop(socket.AF_INET6, inet)

def main():
    # parse all the arguments 
    parser = argparse.ArgumentParser(description='Convert Pcap to packet time/size')
    parser.add_argument('-r','--read', help='Input File', required=True)
    parser.add_argument('-w','--write', help='Output File', required=False)
    parser.add_argument('-n','--count', help='Packet Count', required=False)
    parser.add_argument('-t','--tcp', help='Match TCP', required=False)
    parser.add_argument('-u','--udp', help='Match UDP', required=False)
    parser.add_argument('-a','--destip', help='Destination IP address', required=False)
    parser.add_argument('-b','--destport', help='Destination port', required=False)
    parser.add_argument('-c','--srcip', help='Destination IP address', required=False)
    parser.add_argument('-d','--srcport', help='Source port', required=False)
    
    counter = 0
    matched_counter = 0
    ipcounter = 0
    tcpcounter = 0
    udpcounter = 0

    doTCP = False   # flag to match for TCP packets 
    doUDP = False   # flag to match for UDP packets 
    packetCount = -1  # how many packets to process 
    
    srcIP = -1
    srcPort = -1 
    destIP = -1 
    destPort = -1 
    
    # get the arguments into local variables 
    args = vars(parser.parse_args())
    filename = args['read']
    output_filename = args['write']
    packetCount = args['count']
    matchTCP = args['tcp']
    matchUDP = args['udp']
    srcIP = args['srcip']
    srcPort = args['srcport']
    destIP = args['destip']
    destPort = args['destport']

    if (packetCount == None):
        packetCount = -1
    else:
        packetCount = int(packetCount)
        
    # open the file for reading
    if (filename):
        try: 
            filesize = os.path.getsize(filename)
            fd_in = open(filename, "rb")
        except:
            print ( "error opening file: %s" % (filename))
            exit(-1)
    else:
        print ('No Input File Specified')        
        exit(-1)

    # open the output file for writing 
    if (output_filename):
        try: 
            fd_out = open(output_filename, 'ab')
        except:
            print ( "error opening file: %s" % (output_filename))
            exit(-1)

            
    if (matchUDP):
        doUDP = True
        doTCP = False
    else:
        doTCP = True
        doUDP = False 

    if (srcIP == None):
        srcIP = -1
    if (srcPort == None):
        srcPort = -1
    if (destIP == None):
        destIP = -1
    if (destPort == None):
        destPort = -1 
        
    rules = MatchRules(doTCP,doUDP,destIP,destPort,srcIP,srcPort)
    print("got match rules: %s \n" % rules.tostr())
        
    old_ts = ''
    counter = 0
    time_diff_sec = 0.0  # time difference between packets 

    try: 
        for ts, pkt in dpkt.pcap.Reader(fd_in):

            if (packetCount != -1):
                if counter > packetCount:
                    break;

            if (counter == 0):
                time_diff_sec = 0
            else:
                time_diff_sec = ts - old_ts
            
            eth=dpkt.ethernet.Ethernet(pkt) 
            if eth.type!=dpkt.ethernet.ETH_TYPE_IP:
                continue

            ip=eth.data
            ipcounter+=1
            payload_len = 0
            
            proto = 'IP'
        
            if ip.p==dpkt.ip.IP_PROTO_TCP:
                proto = 'TCP'
                tcpcounter+=1
                tcp= ip.data 
                payload_len = len(tcp.data) 

            if ip.p==dpkt.ip.IP_PROTO_UDP:
                proto = 'TCP'
                udpcounter+=1
                udp=ip.data
                payload_len = len(udp.data)             

            old_ts = ts 
            counter+=1

            #if ((counter % 100) == 0):
            #    print(".",end='')
            
            if (rules.isMatch(ip) == True):
                    #print("Got packet match", counter)

                    # we are creating a new array for every pair and
                    # writing it to disk here instead of doing the whole
                    # array at once because packet corruption in the pcap
                    # file causes the dpkt library to crash

                    # create a new feature vector 
                    feature_vector = []   # the time diff, size vector
                    # convert time to microseconds
                    feature_vector.append(float(time_diff_sec)*1000000.0)
                    feature_vector.append(float(payload_len))
                    fv = struct.pack('f'*len(feature_vector),*feature_vector)
                    fd_out.write(fv)
                    fd_out.flush()
                    matched_counter = matched_counter + 1 
            else:
                pass
            #print("Match failed")
            
            if (False):
                pass 
            #print("Packet %d time difference %f: proto %s len %d" % (counter,time_diff_sec,proto,payload_len))
    except:
        print("Parsing of pcap file failed at packet number %d" % (counter))
        sys.exit(-1)
        raise()
    else:
        print("Parsing of pcap file succeeded;packet number %d" % (counter))        
        
    print("end of packets ")
    fd_in.close()
    fd_out.close()
    print("Total packets in the pcap file: ", counter)
    print("Total matching packets: ", matched_counter)
    print("Total tcp packets: ", tcpcounter)
    print("Total udp packets: ", udpcounter)

# Write the feature vector output to a file
# Use the python struct class see 
# https://stackoverflow.com/questions/807863/how-to-output-list-of-floats-to-a-binary-file-in-python


   
# this gives a main function in Python
if __name__ == "__main__":
    main()



