import sys
import numpy as np




def solve (rep):
    result = []

    return result

def parse (f):
    result = []
    problem = False

    for line in f:
        tokens = line.split (' ')
        for e in tokens:
            if e not in {'p', 'c', '0'}:
                result.append (e.strip ())
            elif e == 'p':
                problem = True
                assert result == []
            elif e == 'c':
                continue
            elif e == '0':
                if problem:
                    yield tuple (result[1:])
                else:
                    yield (int (x) for x in result)
            else:
                raise Exception ('Bad input token: {}.'.format (e))

def valid_permutations (clause):
    """Expects an iterator of three integers representing a 3CNF clause
    as input.
    Yields 7 valid permutations by negating components."""
    clause = list (clause)
    yield {-x if i & 2**j else x for i in range (7) for j, x in enumerate
           (clause)}

class Node:
    def __init__ (i, j, expr, N):
        self.i, self.j = i, j
        self.expr = {abs (x): x>0 for x in expr}
        self.layer = np.ones (N, 7)

    def


if __name__ == '__main__':

    if len (sys.argv) <= 1:
        raise Exception ('Need input file as argument.')

    node = []
    with open (sys.argv[1], 'r') as f:
        for i, clause in enumerate (parse (f)):
            if len (clause) == 2:
                N, P = clause
                continue
            row = []
            for j, expr in enumerate (valid_permutations (clause)):
                row.append (Node (i, j, expr, N))
            node.append (row)

    result = solve (rep)
    print (result)
