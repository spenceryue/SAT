import sys
import numpy as np
from functools import total_ordering


@total_ordering
class Node:
    __slots__ = ['layer_start', 'idx', 'data']



    def __init__ (self, idx, N):
        self.layer_start = (idx // 7) * 7
        self.idx = idx
        self.data = np.zeros (N)

    @property
    def predecessors (self):
        if self.idx > 7:
            start = self.layer_start
            return self.data[start-7:start]
        else:
            return []

    def __getitem__ (self, key):
        return self.data[key]

    def __setitem__ (self, key, value):
        self.data[key] = value

    def __eq__ (self, other):
        return self.idx == other.idx

    def __lt__ (self, other):
        return self.idx < other.idx

    def is_valid (self):
        if self.idx < 7:
            return True
        else:
            result = True
            predecessors = self.predecessors
            while predecessors:
                result &= any (predecessors)
                predecessors = predecessors[0]

class Layer:
    __slots__ = ['slice', 'next', 'data']

    def __init__ (self, data):
        self.data = data
        self.


def solve (rep):
    result = []

    return result

def parse (input):
    rep = []

    return rep

if __name__ == '__main__':

    if len (sys.argv) > 1:
        with open (sys.argv[1], 'r') as f:
            rep = parse (f)
    else:
        rep = parse (sys.stdin)

    result = solve (rep)
    print (result)
